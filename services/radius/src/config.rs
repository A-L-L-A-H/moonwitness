use std::net::IpAddr;
use std::str::FromStr;

use serde::Deserialize;

pub const FORBIDDEN_DEFAULT_SECRET: &str = "moonwitness-radius-secret";

/// Simple IPv4/IPv6 CIDR network matcher.
#[derive(Debug, Clone)]
pub struct CidrNet {
    addr: IpAddr,
    prefix: u8,
}

impl CidrNet {
    pub fn contains(&self, ip: &IpAddr) -> bool {
        match (self.addr, *ip) {
            (IpAddr::V4(net), IpAddr::V4(target)) => {
                if self.prefix == 0 {
                    return true;
                }
                let mask = u32::MAX
                    .checked_shl(32 - u32::from(self.prefix))
                    .unwrap_or(0);
                (u32::from(net) & mask) == (u32::from(target) & mask)
            }
            (IpAddr::V6(net), IpAddr::V6(target)) => {
                if self.prefix == 0 {
                    return true;
                }
                let mask = u128::MAX
                    .checked_shl(128 - u32::from(self.prefix))
                    .unwrap_or(0);
                (u128::from(net) & mask) == (u128::from(target) & mask)
            }
            _ => false,
        }
    }
}

impl FromStr for CidrNet {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if let Some((ip_str, prefix_str)) = s.split_once('/') {
            let addr: IpAddr = ip_str.parse()?;
            let prefix: u8 = prefix_str.parse()?;
            let max = match addr {
                IpAddr::V4(_) => 32,
                IpAddr::V6(_) => 128,
            };
            if prefix > max {
                anyhow::bail!("prefix {prefix} exceeds max {max}");
            }
            Ok(CidrNet { addr, prefix })
        } else {
            let addr: IpAddr = s.parse()?;
            let prefix = match addr {
                IpAddr::V4(_) => 32,
                IpAddr::V6(_) => 128,
            };
            Ok(CidrNet { addr, prefix })
        }
    }
}

/// Per-NAS client credential entry.
#[derive(Debug, Clone)]
pub struct NasClient {
    pub id: String,
    pub cidr: CidrNet,
    pub secret: String,
    pub previous_secret: Option<String>,
}

impl NasClient {
    /// Returns active secret followed by optional previous secret (for rotation overlap).
    pub fn secrets(&self) -> Vec<&str> {
        let mut out = vec![self.secret.as_str()];
        if let Some(prev) = self.previous_secret.as_deref() {
            if !prev.trim().is_empty() {
                out.push(prev);
            }
        }
        out
    }
}

#[derive(Debug, Deserialize)]
struct NasClientInput {
    id: String,
    cidr: String,
    secret: String,
    #[serde(default)]
    previous_secret: Option<String>,
}

/// Runtime configuration for the RADIUS service, loaded from environment.
#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub http_port: u16,
    pub radius_auth_port: u16,
    pub radius_acct_port: u16,
    pub radius_secret: String,
    pub nas_clients: Vec<NasClient>,
    pub database_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Self::from_lookup(|key| std::env::var(key).ok())
    }

    /// Load and validate configuration from a key-lookup closure.
    pub fn from_lookup<F>(mut get_env: F) -> anyhow::Result<Self>
    where
        F: FnMut(&str) -> Option<String>,
    {
        let host = get_env("HOST").unwrap_or_else(|| "127.0.0.1".to_string());
        let http_port = get_env("HTTP_PORT")
            .unwrap_or_else(|| "3000".to_string())
            .parse::<u16>()?;
        let radius_auth_port = get_env("RADIUS_AUTH_PORT")
            .unwrap_or_else(|| "1812".to_string())
            .parse::<u16>()?;
        let radius_acct_port = get_env("RADIUS_ACCT_PORT")
            .unwrap_or_else(|| "1813".to_string())
            .parse::<u16>()?;
        let radius_secret = get_env("RADIUS_SECRET").unwrap_or_default();
        let nas_clients_raw = get_env("RADIUS_NAS_CLIENTS").unwrap_or_default();
        let database_url =
            get_env("DATABASE_URL").unwrap_or_else(|| "sqlite:./radius.db?mode=rwc".to_string());

        let mut nas_clients = Vec::new();
        if !nas_clients_raw.trim().is_empty() {
            let parsed: Vec<NasClientInput> = serde_json::from_str(&nas_clients_raw)
                .map_err(|e| anyhow::anyhow!("RADIUS_NAS_CLIENTS invalid JSON: {e}"))?;
            for entry in parsed {
                let cidr: CidrNet = entry.cidr.parse().map_err(|e| {
                    anyhow::anyhow!("RADIUS_NAS_CLIENTS invalid cidr {:?}: {e}", entry.cidr)
                })?;
                nas_clients.push(NasClient {
                    id: entry.id,
                    cidr,
                    secret: entry.secret,
                    previous_secret: entry.previous_secret,
                });
            }
        } else if !radius_secret.trim().is_empty() {
            // Legacy single-secret compatibility: map to 0.0.0.0/0 when explicitly configured.
            nas_clients.push(NasClient {
                id: "default-nas".to_string(),
                cidr: "0.0.0.0/0".parse().expect("valid v4 any cidr"),
                secret: radius_secret.clone(),
                previous_secret: None,
            });
        }

        let config = Config {
            host,
            http_port,
            radius_auth_port,
            radius_acct_port,
            radius_secret,
            nas_clients,
            database_url,
        };
        config.validate()?;
        Ok(config)
    }

    /// Resolve matching NAS client for a peer IP.
    pub fn resolve_nas(&self, peer_ip: IpAddr) -> Option<&NasClient> {
        self.nas_clients
            .iter()
            .find(|client| client.cidr.contains(&peer_ip))
    }

    /// Fail closed on invalid or incomplete runtime configuration.
    pub fn validate(&self) -> anyhow::Result<()> {
        if self.host.trim().is_empty() {
            anyhow::bail!("HOST must not be empty");
        }
        if self.nas_clients.is_empty() {
            anyhow::bail!(
                "RADIUS_NAS_CLIENTS or RADIUS_SECRET must be configured (fail-closed; no default secret)"
            );
        }
        if self.radius_secret == FORBIDDEN_DEFAULT_SECRET {
            anyhow::bail!("RADIUS_SECRET must not use the known hardcoded default");
        }
        for client in &self.nas_clients {
            if client.id.trim().is_empty() {
                anyhow::bail!("RADIUS_NAS_CLIENTS entry id must not be empty");
            }
            if client.secret.trim().is_empty() {
                anyhow::bail!(
                    "RADIUS_NAS_CLIENTS entry {} secret must not be empty",
                    client.id
                );
            }
            if client.secret == FORBIDDEN_DEFAULT_SECRET {
                anyhow::bail!(
                    "RADIUS_NAS_CLIENTS entry {} must not use the known hardcoded default secret",
                    client.id
                );
            }
            if let Some(prev) = client.previous_secret.as_deref() {
                if prev == FORBIDDEN_DEFAULT_SECRET {
                    anyhow::bail!(
                        "RADIUS_NAS_CLIENTS entry {} previous_secret must not use the known hardcoded default secret",
                        client.id
                    );
                }
            }
        }
        if self.database_url.trim().is_empty() {
            anyhow::bail!("DATABASE_URL must not be empty");
        }
        if self.radius_auth_port != 0 && self.radius_auth_port == self.radius_acct_port {
            anyhow::bail!("RADIUS_AUTH_PORT and RADIUS_ACCT_PORT must be distinct");
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    fn lookup_from(pairs: &[(&str, &str)]) -> impl FnMut(&str) -> Option<String> {
        let map: HashMap<String, String> = pairs
            .iter()
            .map(|(k, v)| ((*k).to_string(), (*v).to_string()))
            .collect();
        move |key| map.get(key).cloned()
    }

    #[test]
    fn from_lookup_fails_closed_without_secret() {
        let err = Config::from_lookup(lookup_from(&[])).unwrap_err();
        assert!(
            err.to_string().contains("RADIUS_SECRET")
                || err.to_string().contains("RADIUS_NAS_CLIENTS")
        );
    }

    #[test]
    fn from_lookup_rejects_hardcoded_default_secret() {
        let err = Config::from_lookup(lookup_from(&[("RADIUS_SECRET", FORBIDDEN_DEFAULT_SECRET)]))
            .unwrap_err();
        assert!(err.to_string().contains("hardcoded default"));
    }

    #[test]
    fn from_lookup_parses_nas_clients_registry() {
        let cfg = Config::from_lookup(lookup_from(&[(
            "RADIUS_NAS_CLIENTS",
            r#"[{"id":"mikrotik-1","cidr":"10.10.0.1/32","secret":"s3cr3t-1","previous_secret":"old-s3cr3t"}]"#,
        )]))
        .unwrap();
        assert_eq!(cfg.nas_clients.len(), 1);
        let nas = cfg.resolve_nas("10.10.0.1".parse().unwrap()).unwrap();
        assert_eq!(nas.id, "mikrotik-1");
        assert_eq!(nas.secrets(), vec!["s3cr3t-1", "old-s3cr3t"]);
        assert!(cfg.resolve_nas("10.10.0.2".parse().unwrap()).is_none());
    }

    #[test]
    fn from_lookup_parses_custom_values() {
        let cfg = Config::from_lookup(lookup_from(&[
            ("HOST", "0.0.0.0"),
            ("HTTP_PORT", "8090"),
            ("RADIUS_AUTH_PORT", "11812"),
            ("RADIUS_ACCT_PORT", "11813"),
            ("RADIUS_SECRET", "lab-shared-secret"),
            ("DATABASE_URL", "sqlite::memory:"),
        ]))
        .unwrap();
        assert_eq!(cfg.host, "0.0.0.0");
        assert_eq!(cfg.http_port, 8090);
        assert_eq!(cfg.radius_auth_port, 11812);
        assert_eq!(cfg.radius_acct_port, 11813);
        assert_eq!(cfg.radius_secret, "lab-shared-secret");
        assert_eq!(cfg.database_url, "sqlite::memory:");
    }

    #[test]
    fn from_lookup_rejects_invalid_ports() {
        for (key, val) in [
            ("HTTP_PORT", "not-a-port"),
            ("HTTP_PORT", "70000"),
            ("HTTP_PORT", ""),
            ("RADIUS_AUTH_PORT", "-1"),
            ("RADIUS_AUTH_PORT", "65536"),
            ("RADIUS_ACCT_PORT", "abc"),
        ] {
            let err = Config::from_lookup(lookup_from(&[
                ("RADIUS_SECRET", "lab-shared-secret"),
                (key, val),
            ]))
            .unwrap_err();
            assert!(
                !err.to_string().is_empty(),
                "expected error for {key}={val}"
            );
        }
    }

    #[test]
    fn from_lookup_rejects_empty_required_strings() {
        for (key, val) in [
            ("HOST", ""),
            ("HOST", "   "),
            ("RADIUS_SECRET", ""),
            ("RADIUS_SECRET", " \t "),
            ("DATABASE_URL", ""),
            ("DATABASE_URL", "   "),
        ] {
            let err = Config::from_lookup(lookup_from(&[
                ("RADIUS_SECRET", "lab-shared-secret"),
                (key, val),
            ]))
            .unwrap_err();
            assert!(
                !err.to_string().is_empty(),
                "expected error for {key}={val}"
            );
        }
    }

    #[test]
    fn from_lookup_rejects_duplicate_nonzero_radius_ports() {
        let err = Config::from_lookup(lookup_from(&[
            ("RADIUS_SECRET", "lab-shared-secret"),
            ("RADIUS_AUTH_PORT", "1812"),
            ("RADIUS_ACCT_PORT", "1812"),
        ]))
        .unwrap_err();
        assert!(err.to_string().contains("distinct"));

        // Ephemeral port 0 may be repeated for both sockets.
        let ok = Config::from_lookup(lookup_from(&[
            ("RADIUS_SECRET", "lab-shared-secret"),
            ("RADIUS_AUTH_PORT", "0"),
            ("RADIUS_ACCT_PORT", "0"),
        ]));
        assert!(ok.is_ok());
    }
}
