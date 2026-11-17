use std::str::FromStr;
use std::time::Duration;

/// Default maximum size (bytes) of a single TCP syslog line frame (including `\n`).
pub const DEFAULT_MAX_TCP_FRAME_BYTES: usize = 64 * 1024;
/// Default maximum concurrent active TCP syslog connections.
pub const DEFAULT_MAX_TCP_CONNECTIONS: usize = 256;
/// Default maximum concurrent active TCP syslog connections per source IP.
pub const DEFAULT_MAX_TCP_CONNECTIONS_PER_IP: usize = 32;
/// Default idle / per-frame read timeout (seconds) for TCP syslog connections.
pub const DEFAULT_TCP_READ_TIMEOUT_SECS: u64 = 30;
/// Default number of ingested messages before waking the background retention pruner.
pub const DEFAULT_RETENTION_PRUNE_THRESHOLD: usize = 500;
/// Default interval (seconds) between periodic background retention sweeps.
pub const DEFAULT_RETENTION_PRUNE_INTERVAL_SECS: u64 = 10;
/// Default maximum rows deleted per SQLite retention chunk.
pub const DEFAULT_RETENTION_PRUNE_BATCH_SIZE: i64 = 1000;

/// Runtime configuration for the syslog service, loaded from environment.
#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub http_port: u16,
    pub syslog_udp_port: u16,
    pub syslog_tcp_port: u16,
    pub database_url: String,
    /// Maximum messages retained in SQLite (`0` disables retention pruning).
    pub max_messages: i64,
    /// Maximum size in bytes of a single TCP line frame (including `\n`).
    pub max_tcp_frame_bytes: usize,
    /// Maximum concurrent active TCP syslog connections.
    pub max_tcp_connections: usize,
    /// Maximum concurrent active TCP syslog connections per source IP.
    pub max_tcp_connections_per_ip: usize,
    /// Idle / per-frame read timeout in seconds for TCP syslog clients.
    pub tcp_read_timeout_secs: u64,
    /// Newly ingested message count threshold that triggers background retention pruning.
    pub retention_prune_threshold: usize,
    /// Periodic interval in seconds for background retention pruning checks.
    pub retention_prune_interval_secs: u64,
    /// Maximum rows deleted per bounded SQLite retention `DELETE` chunk.
    pub retention_prune_batch_size: i64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            http_port: 8093,
            syslog_udp_port: 5140,
            syslog_tcp_port: 5514,
            database_url: "sqlite:./syslog.db?mode=rwc".to_string(),
            max_messages: 100_000,
            max_tcp_frame_bytes: DEFAULT_MAX_TCP_FRAME_BYTES,
            max_tcp_connections: DEFAULT_MAX_TCP_CONNECTIONS,
            max_tcp_connections_per_ip: DEFAULT_MAX_TCP_CONNECTIONS_PER_IP,
            tcp_read_timeout_secs: DEFAULT_TCP_READ_TIMEOUT_SECS,
            retention_prune_threshold: DEFAULT_RETENTION_PRUNE_THRESHOLD,
            retention_prune_interval_secs: DEFAULT_RETENTION_PRUNE_INTERVAL_SECS,
            retention_prune_batch_size: DEFAULT_RETENTION_PRUNE_BATCH_SIZE,
        }
    }
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Self::from_lookup(|key| match std::env::var(key) {
            Ok(v) => Ok(Some(v)),
            Err(std::env::VarError::NotPresent) => Ok(None),
            Err(e) => Err(anyhow::anyhow!("failed to read {key}: {e}")),
        })
    }

    pub fn from_lookup<F>(mut lookup: F) -> anyhow::Result<Self>
    where
        F: FnMut(&str) -> anyhow::Result<Option<String>>,
    {
        let defaults = Self::default();
        let host = lookup("HOST")?.unwrap_or(defaults.host);
        let allow_public_bind = lookup("ALLOW_PUBLIC_BIND")?
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false);
        if !allow_public_bind && !is_private_or_loopback(&host) {
            anyhow::bail!("HOST {host:?} is non-private; set ALLOW_PUBLIC_BIND=1 to override");
        }
        let http_port = parse_var(&mut lookup, "HTTP_PORT", defaults.http_port)?;
        let syslog_udp_port = parse_var(&mut lookup, "SYSLOG_UDP_PORT", defaults.syslog_udp_port)?;
        let syslog_tcp_port = parse_var(&mut lookup, "SYSLOG_TCP_PORT", defaults.syslog_tcp_port)?;
        let database_url = lookup("DATABASE_URL")?.unwrap_or(defaults.database_url);
        let max_messages = parse_var(&mut lookup, "SYSLOG_MAX_MESSAGES", defaults.max_messages)?;
        let max_tcp_frame_bytes = parse_var(
            &mut lookup,
            "SYSLOG_MAX_TCP_FRAME_BYTES",
            defaults.max_tcp_frame_bytes,
        )?;
        let max_tcp_connections = parse_var(
            &mut lookup,
            "SYSLOG_MAX_TCP_CONNECTIONS",
            defaults.max_tcp_connections,
        )?;
        let max_tcp_connections_per_ip = parse_var(
            &mut lookup,
            "SYSLOG_MAX_TCP_CONNECTIONS_PER_IP",
            defaults.max_tcp_connections_per_ip,
        )?;
        let tcp_read_timeout_secs = parse_var(
            &mut lookup,
            "SYSLOG_TCP_READ_TIMEOUT_SECS",
            defaults.tcp_read_timeout_secs,
        )?;
        let retention_prune_threshold = parse_var(
            &mut lookup,
            "SYSLOG_RETENTION_THRESHOLD",
            defaults.retention_prune_threshold,
        )?;
        let retention_prune_interval_secs = parse_var(
            &mut lookup,
            "SYSLOG_RETENTION_INTERVAL_SECS",
            defaults.retention_prune_interval_secs,
        )?;
        let retention_prune_batch_size = parse_var(
            &mut lookup,
            "SYSLOG_RETENTION_BATCH_SIZE",
            defaults.retention_prune_batch_size,
        )?;

        if max_messages < 0 {
            anyhow::bail!("SYSLOG_MAX_MESSAGES must be >= 0");
        }
        require_positive("SYSLOG_MAX_TCP_FRAME_BYTES", max_tcp_frame_bytes)?;
        require_positive("SYSLOG_MAX_TCP_CONNECTIONS", max_tcp_connections)?;
        require_positive(
            "SYSLOG_MAX_TCP_CONNECTIONS_PER_IP",
            max_tcp_connections_per_ip,
        )?;
        require_positive("SYSLOG_TCP_READ_TIMEOUT_SECS", tcp_read_timeout_secs)?;
        require_positive("SYSLOG_RETENTION_THRESHOLD", retention_prune_threshold)?;
        require_positive(
            "SYSLOG_RETENTION_INTERVAL_SECS",
            retention_prune_interval_secs,
        )?;
        require_positive("SYSLOG_RETENTION_BATCH_SIZE", retention_prune_batch_size)?;

        Ok(Config {
            host,
            http_port,
            syslog_udp_port,
            syslog_tcp_port,
            database_url,
            max_messages,
            max_tcp_frame_bytes,
            max_tcp_connections,
            max_tcp_connections_per_ip,
            tcp_read_timeout_secs,
            retention_prune_threshold,
            retention_prune_interval_secs,
            retention_prune_batch_size,
        })
    }

    /// Returns the bounded TCP read timeout as a `Duration` (minimum 1 second).
    pub fn tcp_read_timeout(&self) -> Duration {
        Duration::from_secs(self.tcp_read_timeout_secs.max(1))
    }

    /// Returns the bounded retention sweep interval as a `Duration` (minimum 1 second).
    pub fn retention_prune_interval(&self) -> Duration {
        Duration::from_secs(self.retention_prune_interval_secs.max(1))
    }
}

fn parse_var<T, F>(lookup: &mut F, key: &str, default: T) -> anyhow::Result<T>
where
    T: FromStr,
    T::Err: std::error::Error + Send + Sync + 'static,
    F: FnMut(&str) -> anyhow::Result<Option<String>>,
{
    match lookup(key)? {
        Some(raw) => raw
            .trim()
            .parse::<T>()
            .map_err(|e| anyhow::anyhow!("invalid {key} value '{raw}': {e}")),
        None => Ok(default),
    }
}

fn require_positive<T: PartialOrd + From<u8>>(key: &str, value: T) -> anyhow::Result<()> {
    if value <= T::from(0u8) {
        anyhow::bail!("{key} must be greater than 0");
    }
    Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn loads_safe_operational_defaults() {
        let cfg = Config::from_lookup(|_| Ok(None)).unwrap();
        assert_eq!(cfg.max_tcp_frame_bytes, 65_536);
        assert_eq!(cfg.max_tcp_connections, 256);
        assert_eq!(cfg.max_tcp_connections_per_ip, 32);
        assert_eq!(cfg.tcp_read_timeout_secs, 30);
        assert_eq!(cfg.retention_prune_threshold, 500);
        assert_eq!(cfg.retention_prune_interval_secs, 10);
        assert_eq!(cfg.retention_prune_batch_size, 1000);
        assert_eq!(cfg.max_messages, 100_000);
    }

    #[test]
    fn rejects_zero_or_negative_bounds() {
        for (key, val) in [
            ("SYSLOG_MAX_MESSAGES", "-1"),
            ("SYSLOG_MAX_TCP_FRAME_BYTES", "0"),
            ("SYSLOG_MAX_TCP_CONNECTIONS", "0"),
            ("SYSLOG_MAX_TCP_CONNECTIONS_PER_IP", "0"),
            ("SYSLOG_TCP_READ_TIMEOUT_SECS", "0"),
            ("SYSLOG_RETENTION_THRESHOLD", "0"),
            ("SYSLOG_RETENTION_INTERVAL_SECS", "0"),
            ("SYSLOG_RETENTION_BATCH_SIZE", "0"),
        ] {
            let vars = HashMap::from([(key, val.to_string())]);
            let err = Config::from_lookup(|k| Ok(vars.get(k).cloned())).unwrap_err();
            assert!(
                err.to_string().contains(key),
                "expected error mentioning {key}, got: {err}"
            );
        }
    }
}
