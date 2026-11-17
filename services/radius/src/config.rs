/// Runtime configuration for the RADIUS service, loaded from environment.
#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub http_port: u16,
    pub radius_auth_port: u16,
    pub radius_acct_port: u16,
    pub radius_secret: String,
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
        let radius_secret =
            get_env("RADIUS_SECRET").unwrap_or_else(|| "moonwitness-radius-secret".to_string());
        let database_url =
            get_env("DATABASE_URL").unwrap_or_else(|| "sqlite:./radius.db?mode=rwc".to_string());

        let config = Config {
            host,
            http_port,
            radius_auth_port,
            radius_acct_port,
            radius_secret,
            database_url,
        };
        config.validate()?;
        Ok(config)
    }

    /// Fail closed on invalid or incomplete runtime configuration.
    pub fn validate(&self) -> anyhow::Result<()> {
        if self.host.trim().is_empty() {
            anyhow::bail!("HOST must not be empty");
        }
        if self.radius_secret.trim().is_empty() {
            anyhow::bail!("RADIUS_SECRET must not be empty");
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
    fn from_lookup_uses_defaults() {
        let cfg = Config::from_lookup(lookup_from(&[])).unwrap();
        assert_eq!(cfg.host, "127.0.0.1");
        assert_eq!(cfg.http_port, 3000);
        assert_eq!(cfg.radius_auth_port, 1812);
        assert_eq!(cfg.radius_acct_port, 1813);
        assert!(!cfg.radius_secret.is_empty());
        assert_eq!(cfg.database_url, "sqlite:./radius.db?mode=rwc");
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
            let err = Config::from_lookup(lookup_from(&[(key, val)])).unwrap_err();
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
            let err = Config::from_lookup(lookup_from(&[(key, val)])).unwrap_err();
            assert!(
                err.to_string().contains(key),
                "expected error mentioning {key}, got: {err}"
            );
        }
    }

    #[test]
    fn from_lookup_rejects_duplicate_nonzero_radius_ports() {
        let err = Config::from_lookup(lookup_from(&[
            ("RADIUS_AUTH_PORT", "1812"),
            ("RADIUS_ACCT_PORT", "1812"),
        ]))
        .unwrap_err();
        assert!(err.to_string().contains("distinct"));

        // Ephemeral port 0 may be repeated for both sockets.
        let ok = Config::from_lookup(lookup_from(&[
            ("RADIUS_AUTH_PORT", "0"),
            ("RADIUS_ACCT_PORT", "0"),
        ]));
        assert!(ok.is_ok());
    }
}
