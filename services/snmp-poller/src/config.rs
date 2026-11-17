#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub http_port: u16,
    pub database_url: String,
    pub poll_interval: i64,
    pub timeout_ms: u64,
    pub max_samples: i64,
    #[allow(dead_code)]
    pub credential_key: [u8; 32],
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let http_port = std::env::var("HTTP_PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse::<u16>()?;
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./snmp-poller.db?mode=rwc".to_string());
        let poll_interval = std::env::var("SNMP_POLL_INTERVAL")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<i64>()?;
        let timeout_ms = std::env::var("SNMP_TIMEOUT_MS")
            .unwrap_or_else(|_| "2000".to_string())
            .parse::<u64>()?;
        let max_samples = std::env::var("SNMP_MAX_SAMPLES")
            .unwrap_or_else(|_| "50000".to_string())
            .parse::<i64>()?;

        let allow_public_bind = std::env::var("ALLOW_PUBLIC_BIND")
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false);
        if !allow_public_bind && !is_private_or_loopback(&host) {
            anyhow::bail!("HOST {host:?} is non-private; set ALLOW_PUBLIC_BIND=1 to override");
        }

        let credential_key = match std::env::var("SNMP_CREDENTIAL_KEY") {
            Ok(raw) if !raw.trim().is_empty() => crate::crypto::parse_master_key(&raw)?,
            _ => [0x5Au8; 32], // Dev/test fallback when SNMP_CREDENTIAL_KEY is unset
        };

        Ok(Config {
            host,
            http_port,
            database_url,
            poll_interval: poll_interval.max(1),
            timeout_ms,
            max_samples,
            credential_key,
        })
    }
}

fn is_private_or_loopback(host: &str) -> bool {
    if host.eq_ignore_ascii_case("localhost") {
        return true;
    }
    match host.parse::<std::net::IpAddr>() {
        Ok(std::net::IpAddr::V4(ip)) => ip.is_loopback() || ip.is_private() || ip.is_link_local(),
        Ok(std::net::IpAddr::V6(ip)) => ip.is_loopback(),
        Err(_) => false,
    }
}
