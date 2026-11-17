//! UDP RADIUS listeners for authentication (1812) and accounting (1813).

use std::net::SocketAddr;
use std::sync::Arc;

use tokio::net::UdpSocket;
use tokio::task::JoinHandle;

use crate::config::Config;
use crate::db::Pool;
use crate::models::User;
use crate::radius::attributes::{self, Attribute};
use crate::radius::auth;
use crate::radius::packet::{
    RadiusPacket, CODE_ACCESS_ACCEPT, CODE_ACCESS_REJECT, CODE_ACCESS_REQUEST,
    CODE_ACCOUNTING_REQUEST, CODE_ACCOUNTING_RESPONSE,
};

const MAX_PACKET: usize = 4096;

pub struct RadiusServer {
    config: Arc<Config>,
    pool: Pool,
}

impl RadiusServer {
    pub fn new(config: Arc<Config>, pool: Pool) -> Self {
        RadiusServer { config, pool }
    }

    /// Bind both UDP listeners and spawn their background loops.
    /// Fails closed if config is invalid or either UDP socket cannot be bound.
    pub async fn try_spawn(self) -> anyhow::Result<RadiusHandle> {
        self.config.validate()?;
        let auth_addr = format!("{}:{}", self.config.host, self.config.radius_auth_port);
        let acct_addr = format!("{}:{}", self.config.host, self.config.radius_acct_port);

        let auth_socket = UdpSocket::bind(&auth_addr)
            .await
            .map_err(|e| anyhow::anyhow!("failed to bind RADIUS auth socket {auth_addr}: {e}"))?;
        let acct_socket = UdpSocket::bind(&acct_addr)
            .await
            .map_err(|e| anyhow::anyhow!("failed to bind RADIUS acct socket {acct_addr}: {e}"))?;

        tracing::info!(addr = %auth_addr, "RADIUS auth listener started");
        tracing::info!(addr = %acct_addr, "RADIUS accounting listener started");

        let (shutdown_tx, mut shutdown_rx) = tokio::sync::watch::channel(false);

        let auth_task = tokio::spawn(run_loop(
            auth_socket,
            self.config.clone(),
            self.pool.clone(),
            Role::Auth,
        ));
        let acct_task = tokio::spawn(run_loop(
            acct_socket,
            self.config,
            self.pool,
            Role::Accounting,
        ));

        let handle = tokio::spawn(async move {
            let _ = shutdown_rx.changed().await;
            auth_task.abort();
            acct_task.abort();
        });

        Ok(RadiusHandle {
            shutdown_tx,
            task: handle,
        })
    }
}

pub struct RadiusHandle {
    shutdown_tx: tokio::sync::watch::Sender<bool>,
    task: JoinHandle<()>,
}

impl RadiusHandle {
    pub async fn shutdown(self) {
        let _ = self.shutdown_tx.send(true);
        let _ = self.task.await;
    }
}

#[derive(Clone, Copy)]
enum Role {
    Auth,
    Accounting,
}

async fn run_loop(socket: UdpSocket, config: Arc<Config>, pool: Pool, role: Role) {
    let mut buf = vec![0u8; MAX_PACKET];
    loop {
        let (n, peer) = match socket.recv_from(&mut buf).await {
            Ok(v) => v,
            Err(e) => {
                tracing::error!(error = %e, "RADIUS recv error");
                continue;
            }
        };
        if let Some(response) = handle_datagram(&buf[..n], peer, &config, &pool, role).await {
            if let Err(e) = socket.send_to(&response, peer).await {
                tracing::error!(error = %e, %peer, "RADIUS send error");
            }
        }
    }
}

async fn handle_datagram(
    data: &[u8],
    peer: SocketAddr,
    config: &Config,
    pool: &Pool,
    role: Role,
) -> Option<Vec<u8>> {
    let packet = RadiusPacket::decode(data)?;
    match (role, packet.code) {
        (Role::Auth, CODE_ACCESS_REQUEST) => {
            Some(handle_access_request(packet, peer, config, pool).await)
        }
        (Role::Accounting, CODE_ACCOUNTING_REQUEST) => {
            if !packet.verify_accounting_request(data, &config.radius_secret) {
                tracing::warn!(%peer, "accounting request with bad authenticator, dropping");
                return None;
            }
            Some(handle_accounting(packet, peer, config, pool).await)
        }
        (_, other) => {
            tracing::warn!(code = other, %peer, "unexpected RADIUS code");
            None
        }
    }
}

async fn handle_access_request(
    request: RadiusPacket,
    peer: SocketAddr,
    config: &Config,
    pool: &Pool,
) -> Vec<u8> {
    let username =
        attributes::attr_string(&request.attributes, attributes::USER_NAME).unwrap_or_default();
    let nas_ip = peer.ip().to_string();

    match authenticate(&request, &username, config, pool).await {
        Some(user) => {
            let mut attrs = Vec::new();
            if let Some(ip) = &user.framed_ip {
                if let Ok(addr) = ip.parse::<std::net::Ipv4Addr>() {
                    attrs.push(Attribute::new(
                        attributes::FRAMED_IP_ADDRESS,
                        &addr.octets(),
                    ));
                }
            }
            if let Some(vlan) = user.vlan_id {
                attrs.extend(attributes::vlan_attributes(vlan as u16));
            }
            if let Some(timeout) = user.session_timeout {
                attrs.push(Attribute::new(
                    attributes::SESSION_TIMEOUT,
                    &(timeout as u32).to_be_bytes(),
                ));
            }
            record_log(pool, &username, &nas_ip, "access", "accept", &user).await;
            RadiusPacket {
                code: CODE_ACCESS_ACCEPT,
                identifier: request.identifier,
                authenticator: [0u8; 16],
                attributes: attrs,
            }
            .encode(Some(&request.authenticator), &config.radius_secret)
        }
        None => {
            let reason = if username.is_empty() {
                "missing username"
            } else {
                "invalid credentials or disabled"
            };
            let attrs = vec![Attribute::new(attributes::ERROR_MESSAGE, reason.as_bytes())];
            record_log_reject(pool, &username, &nas_ip, reason).await;
            RadiusPacket {
                code: CODE_ACCESS_REJECT,
                identifier: request.identifier,
                authenticator: [0u8; 16],
                attributes: attrs,
            }
            .encode(Some(&request.authenticator), &config.radius_secret)
        }
    }
}

async fn authenticate(
    request: &RadiusPacket,
    username: &str,
    config: &Config,
    pool: &Pool,
) -> Option<User> {
    if username.is_empty() {
        return None;
    }

    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password, enabled, framed_ip, vlan_id, session_timeout, mac_address \
         FROM users WHERE username = ?",
    )
    .bind(username)
    .fetch_optional(pool)
    .await
    .ok()??;

    if !user.enabled {
        return None;
    }

    let encrypted = attributes::attr_bytes(&request.attributes, attributes::USER_PASSWORD)?;
    let supplied =
        auth::decrypt_user_password(encrypted, &config.radius_secret, &request.authenticator)?;

    let hash = user.password.clone();
    let ok = tokio::task::spawn_blocking(move || auth::verify_password(&hash, &supplied))
        .await
        .unwrap_or(false);

    ok.then_some(user)
}

async fn handle_accounting(
    request: RadiusPacket,
    peer: SocketAddr,
    config: &Config,
    pool: &Pool,
) -> Vec<u8> {
    let username =
        attributes::attr_string(&request.attributes, attributes::USER_NAME).unwrap_or_default();
    let status = attributes::attr_u32(&request.attributes, attributes::ACCT_STATUS_TYPE)
        .map(|s| match s {
            1 => "start",
            2 => "stop",
            3 => "interim-update",
            _ => "accounting",
        })
        .unwrap_or("accounting");
    let nas_ip = peer.ip().to_string();

    record_log_accounting(pool, &username, &nas_ip, status).await;

    RadiusPacket {
        code: CODE_ACCOUNTING_RESPONSE,
        identifier: request.identifier,
        authenticator: [0u8; 16],
        attributes: Vec::new(),
    }
    .encode(Some(&request.authenticator), &config.radius_secret)
}

async fn record_log(
    pool: &Pool,
    username: &str,
    nas_ip: &str,
    event: &str,
    result: &str,
    user: &User,
) {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let _ = sqlx::query(
        "INSERT INTO radius_logs (id, username, nas_ip, nas_port, event, result, framed_ip, vlan_id, created_at) \
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(username)
    .bind(nas_ip)
    .bind(event)
    .bind(result)
    .bind(&user.framed_ip)
    .bind(user.vlan_id)
    .bind(now)
    .execute(pool)
    .await;
}

async fn record_log_reject(pool: &Pool, username: &str, nas_ip: &str, reason: &str) {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let _ = sqlx::query(
        "INSERT INTO radius_logs (id, username, nas_ip, nas_port, event, result, framed_ip, vlan_id, created_at) \
         VALUES (?, ?, ?, NULL, 'access', ?, NULL, NULL, ?)",
    )
    .bind(&id)
    .bind(username)
    .bind(nas_ip)
    .bind(format!("reject: {reason}"))
    .bind(now)
    .execute(pool)
    .await;
}

async fn record_log_accounting(pool: &Pool, username: &str, nas_ip: &str, status: &str) {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let _ = sqlx::query(
        "INSERT INTO radius_logs (id, username, nas_ip, nas_port, event, result, framed_ip, vlan_id, created_at) \
         VALUES (?, ?, ?, NULL, ?, 'recorded', NULL, NULL, ?)",
    )
    .bind(&id)
    .bind(username)
    .bind(nas_ip)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await;
}

#[cfg(test)]
mod tests {
    use std::net::{IpAddr, Ipv4Addr};

    use sqlx::sqlite::SqlitePoolOptions;

    use super::*;
    use crate::radius::packet::{compute_response_authenticator, sign_accounting_request};

    async fn test_pool() -> Pool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    fn test_config() -> Config {
        Config {
            host: "127.0.0.1".to_string(),
            http_port: 0,
            radius_auth_port: 0,
            radius_acct_port: 0,
            radius_secret: "unit-test-radius-secret".to_string(),
            database_url: "sqlite::memory:".to_string(),
        }
    }

    async fn seed_user(pool: &Pool, username: &str, password: &str, enabled: bool) {
        let hash = auth::hash_password(password).unwrap();
        sqlx::query(
            "INSERT INTO users (id, username, password, enabled, framed_ip, vlan_id, session_timeout, mac_address) \
             VALUES (?, ?, ?, ?, ?, ?, ?, NULL)",
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(username)
        .bind(hash)
        .bind(enabled)
        .bind("10.20.30.40")
        .bind(300i64)
        .bind(3600i64)
        .execute(pool)
        .await
        .unwrap();
    }

    fn build_access_request(
        identifier: u8,
        req_auth: [u8; 16],
        username: &str,
        password: &str,
        secret: &str,
    ) -> Vec<u8> {
        let encrypted = auth::encrypt_user_password(password, secret, &req_auth);
        RadiusPacket {
            code: CODE_ACCESS_REQUEST,
            identifier,
            authenticator: req_auth,
            attributes: vec![
                Attribute::new(attributes::USER_NAME, username.as_bytes()),
                Attribute::new(attributes::USER_PASSWORD, &encrypted),
            ],
        }
        .encode(None, secret)
    }

    fn sample_peer() -> SocketAddr {
        SocketAddr::new(IpAddr::V4(Ipv4Addr::new(192, 0, 2, 10)), 40123)
    }

    #[tokio::test]
    async fn try_spawn_binds_ephemeral_ports_and_shuts_down() {
        let pool = test_pool().await;
        let server = RadiusServer::new(Arc::new(test_config()), pool);
        let handle = server.try_spawn().await.unwrap();
        handle.shutdown().await;
    }

    #[tokio::test]
    async fn try_spawn_fails_closed_when_auth_or_acct_port_in_use() {
        let pool = test_pool().await;
        let occupied = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let occupied_port = occupied.local_addr().unwrap().port();

        let mut cfg_auth_conflict = test_config();
        cfg_auth_conflict.radius_auth_port = occupied_port;
        let err = RadiusServer::new(Arc::new(cfg_auth_conflict), pool.clone())
            .try_spawn()
            .await
            .err()
            .expect("occupied auth port must fail closed");
        assert!(err.to_string().contains("auth socket"));

        let mut cfg_acct_conflict = test_config();
        cfg_acct_conflict.radius_acct_port = occupied_port;
        let err = RadiusServer::new(Arc::new(cfg_acct_conflict), pool)
            .try_spawn()
            .await
            .err()
            .expect("occupied acct port must fail closed");
        assert!(err.to_string().contains("acct socket"));
    }

    #[tokio::test]
    async fn try_spawn_fails_closed_on_invalid_config_or_host() {
        let pool = test_pool().await;

        let mut empty_secret = test_config();
        empty_secret.radius_secret = "   ".to_string();
        assert!(RadiusServer::new(Arc::new(empty_secret), pool.clone())
            .try_spawn()
            .await
            .is_err());

        let mut invalid_host = test_config();
        invalid_host.host = "invalid host name".to_string();
        assert!(RadiusServer::new(Arc::new(invalid_host), pool)
            .try_spawn()
            .await
            .is_err());
    }

    #[tokio::test]
    async fn handle_datagram_accepts_valid_access_request_and_encodes_attributes() {
        let pool = test_pool().await;
        let cfg = test_config();
        seed_user(&pool, "alice", "my-secret-pw", true).await;

        let req_auth = [0x11u8; 16];
        let request =
            build_access_request(15, req_auth, "alice", "my-secret-pw", &cfg.radius_secret);
        let raw_response = handle_datagram(&request, sample_peer(), &cfg, &pool, Role::Auth)
            .await
            .expect("Access-Request should yield a response");

        let response = RadiusPacket::decode(&raw_response).unwrap();
        assert_eq!(response.code, CODE_ACCESS_ACCEPT);
        assert_eq!(response.identifier, 15);
        assert_eq!(
            response.authenticator,
            compute_response_authenticator(&raw_response, &req_auth, &cfg.radius_secret)
        );
        assert_eq!(
            attributes::attr_bytes(&response.attributes, attributes::FRAMED_IP_ADDRESS),
            Some([10, 20, 30, 40].as_slice())
        );
        assert_eq!(
            attributes::attr_u32(&response.attributes, attributes::SESSION_TIMEOUT),
            Some(3600)
        );
        assert_eq!(
            attributes::attr_string(&response.attributes, attributes::TUNNEL_PRIVATE_GROUP_ID)
                .as_deref(),
            Some("300")
        );

        let accepted: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM radius_logs WHERE username = 'alice' AND result = 'accept'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(accepted, 1);
    }

    #[tokio::test]
    async fn handle_datagram_rejects_access_request_with_wrong_shared_secret() {
        let pool = test_pool().await;
        let cfg = test_config();
        seed_user(&pool, "alice", "my-secret-pw", true).await;

        let request = build_access_request(
            16,
            [0x22u8; 16],
            "alice",
            "my-secret-pw",
            "wrong-peer-secret",
        );
        let raw_response = handle_datagram(&request, sample_peer(), &cfg, &pool, Role::Auth)
            .await
            .expect("Access-Request with wrong secret should return Access-Reject");

        let response = RadiusPacket::decode(&raw_response).unwrap();
        assert_eq!(response.code, CODE_ACCESS_REJECT);
        assert_eq!(response.identifier, 16);
        assert!(attributes::attr_string(&response.attributes, attributes::ERROR_MESSAGE).is_some());

        let accepts: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM radius_logs WHERE result = 'accept'")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(accepts, 0);
    }

    #[tokio::test]
    async fn handle_datagram_rejects_disabled_user_and_wrong_password() {
        let pool = test_pool().await;
        let cfg = test_config();
        seed_user(&pool, "disabled_user", "right-pw", false).await;
        seed_user(&pool, "enabled_user", "right-pw", true).await;

        let disabled_req = build_access_request(
            21,
            [0x33u8; 16],
            "disabled_user",
            "right-pw",
            &cfg.radius_secret,
        );
        let disabled_resp = RadiusPacket::decode(
            &handle_datagram(&disabled_req, sample_peer(), &cfg, &pool, Role::Auth)
                .await
                .unwrap(),
        )
        .unwrap();
        assert_eq!(disabled_resp.code, CODE_ACCESS_REJECT);

        let wrong_pw_req = build_access_request(
            22,
            [0x44u8; 16],
            "enabled_user",
            "wrong-pw",
            &cfg.radius_secret,
        );
        let wrong_pw_resp = RadiusPacket::decode(
            &handle_datagram(&wrong_pw_req, sample_peer(), &cfg, &pool, Role::Auth)
                .await
                .unwrap(),
        )
        .unwrap();
        assert_eq!(wrong_pw_resp.code, CODE_ACCESS_REJECT);
    }

    #[tokio::test]
    async fn handle_datagram_accounting_verifies_secret_and_drops_invalid_peer_secret() {
        let pool = test_pool().await;
        let cfg = test_config();
        let peer = sample_peer();

        let attrs = vec![
            Attribute::new(attributes::USER_NAME, b"alice"),
            Attribute::new(attributes::ACCT_STATUS_TYPE, &1u32.to_be_bytes()),
        ];

        // Wrong secret must be silently dropped without touching radius_logs.
        let bad_signed = sign_accounting_request(31, attrs.clone(), "rogue-peer-secret");
        assert!(
            handle_datagram(&bad_signed, peer, &cfg, &pool, Role::Accounting)
                .await
                .is_none()
        );
        let logged_after_bad: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM radius_logs")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(logged_after_bad, 0);

        // Valid secret must verify authenticator, record accounting log, and return signed response.
        let valid_signed = sign_accounting_request(32, attrs, &cfg.radius_secret);
        let req_pkt = RadiusPacket::decode(&valid_signed).unwrap();
        let raw_resp = handle_datagram(&valid_signed, peer, &cfg, &pool, Role::Accounting)
            .await
            .expect("valid Accounting-Request should respond");
        let resp_pkt = RadiusPacket::decode(&raw_resp).unwrap();
        assert_eq!(resp_pkt.code, CODE_ACCOUNTING_RESPONSE);
        assert_eq!(resp_pkt.identifier, 32);
        assert_eq!(
            resp_pkt.authenticator,
            compute_response_authenticator(&raw_resp, &req_pkt.authenticator, &cfg.radius_secret)
        );

        let logged: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM radius_logs WHERE username = 'alice' AND event = 'start' AND result = 'recorded'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(logged, 1);
    }

    #[tokio::test]
    async fn handle_datagram_drops_mismatched_code_and_malformed_packets() {
        let pool = test_pool().await;
        let cfg = test_config();
        let peer = sample_peer();

        let acct_pkt = sign_accounting_request(
            40,
            vec![Attribute::new(attributes::USER_NAME, b"alice")],
            &cfg.radius_secret,
        );
        assert!(handle_datagram(&acct_pkt, peer, &cfg, &pool, Role::Auth)
            .await
            .is_none());

        let auth_pkt = build_access_request(41, [0x55u8; 16], "alice", "pw", &cfg.radius_secret);
        assert!(
            handle_datagram(&auth_pkt, peer, &cfg, &pool, Role::Accounting)
                .await
                .is_none()
        );

        assert!(handle_datagram(&[1, 2, 3], peer, &cfg, &pool, Role::Auth)
            .await
            .is_none());
    }
}
