/// Runtime configuration for the storage service, loaded from environment.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StorageBackend {
    Filesystem,
    GoogleDrive,
}

impl StorageBackend {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Filesystem => "filesystem",
            Self::GoogleDrive => "google_drive",
        }
    }
}

#[derive(Clone)]
pub struct GoogleDriveConfig {
    pub client_id: String,
    pub client_secret: String,
    pub refresh_token: String,
    pub folder_id: String,
}

#[derive(Clone)]
pub struct Config {
    pub host: String,
    pub http_port: u16,
    pub storage_root: String,
    pub database_url: String,
    pub access_key: String,
    pub secret_key: String,
    pub allow_anonymous: bool,
    pub max_object_size: u64,
    pub storage_backend: StorageBackend,
    pub google_drive: Option<GoogleDriveConfig>,
}

impl std::fmt::Debug for GoogleDriveConfig {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("GoogleDriveConfig")
            .field("client_id", &self.client_id)
            .field("client_secret", &"[REDACTED]")
            .field("refresh_token", &"[REDACTED]")
            .field("folder_id", &self.folder_id)
            .finish()
    }
}

impl std::fmt::Debug for Config {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("Config")
            .field("host", &self.host)
            .field("http_port", &self.http_port)
            .field("storage_root", &self.storage_root)
            .field("database_url", &self.database_url)
            .field("access_key", &"[REDACTED]")
            .field("secret_key", &"[REDACTED]")
            .field("allow_anonymous", &self.allow_anonymous)
            .field("max_object_size", &self.max_object_size)
            .field("storage_backend", &self.storage_backend)
            .field("google_drive", &self.google_drive)
            .finish()
    }
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let http_port = std::env::var("HTTP_PORT")
            .unwrap_or_else(|_| "8091".to_string())
            .parse::<u16>()?;
        let storage_root = std::env::var("STORAGE_ROOT").unwrap_or_else(|_| "./data".to_string());
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./storage.db?mode=rwc".to_string());
        let access_key = std::env::var("STORAGE_ACCESS_KEY")
            .map_err(|_| anyhow::anyhow!("STORAGE_ACCESS_KEY must be configured"))?;
        let secret_key = std::env::var("STORAGE_SECRET_KEY")
            .map_err(|_| anyhow::anyhow!("STORAGE_SECRET_KEY must be configured"))?;
        if access_key.trim().is_empty() {
            anyhow::bail!("STORAGE_ACCESS_KEY must not be empty");
        }
        if secret_key.trim().is_empty() {
            anyhow::bail!("STORAGE_SECRET_KEY must not be empty");
        }

        let backend_name = std::env::var("STORAGE_BACKEND")
            .unwrap_or_else(|_| "filesystem".to_string())
            .trim()
            .to_ascii_lowercase();
        let storage_backend = match backend_name.as_str() {
            "filesystem" | "fs" => StorageBackend::Filesystem,
            "google_drive" | "google-drive" | "gdrive" => StorageBackend::GoogleDrive,
            other => anyhow::bail!(
                "unsupported STORAGE_BACKEND '{other}'; use 'filesystem' or 'google_drive'"
            ),
        };

        let google_drive = if storage_backend == StorageBackend::GoogleDrive {
            Some(GoogleDriveConfig {
                client_id: required_env("GOOGLE_DRIVE_CLIENT_ID")?,
                client_secret: required_env("GOOGLE_DRIVE_CLIENT_SECRET")?,
                refresh_token: required_env("GOOGLE_DRIVE_REFRESH_TOKEN")?,
                folder_id: required_env("GOOGLE_DRIVE_FOLDER_ID")?,
            })
        } else {
            None
        };

        let allow_anonymous = std::env::var("STORAGE_ALLOW_ANONYMOUS")
            .map(|v| matches!(v.trim().to_ascii_lowercase().as_str(), "1" | "true" | "yes"))
            .unwrap_or(false);
        let max_object_size = std::env::var("STORAGE_MAX_OBJECT_SIZE")
            .unwrap_or_else(|_| (512 * 1024 * 1024).to_string())
            .parse::<u64>()?;

        let allow_public_bind = std::env::var("ALLOW_PUBLIC_BIND")
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false);
        if !allow_public_bind && !is_private_or_loopback(&host) {
            anyhow::bail!("HOST {host:?} is non-private; set ALLOW_PUBLIC_BIND=1 to override");
        }

        Ok(Config {
            host,
            http_port,
            storage_root,
            database_url,
            access_key,
            secret_key,
            allow_anonymous,
            max_object_size,
            storage_backend,
            google_drive,
        })
    }
}

fn required_env(name: &str) -> anyhow::Result<String> {
    let value = std::env::var(name).map_err(|_| {
        anyhow::anyhow!("{name} must be configured when STORAGE_BACKEND=google_drive")
    })?;
    if value.trim().is_empty() {
        anyhow::bail!("{name} must not be empty when STORAGE_BACKEND=google_drive");
    }
    Ok(value)
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

    #[test]
    fn debug_output_redacts_storage_credentials() {
        let config = Config {
            host: "127.0.0.1".to_string(),
            http_port: 8091,
            storage_root: "./data".to_string(),
            database_url: "sqlite::memory:".to_string(),
            access_key: "s3-access-secret".to_string(),
            secret_key: "s3-secret-secret".to_string(),
            allow_anonymous: false,
            max_object_size: 1024,
            storage_backend: StorageBackend::GoogleDrive,
            google_drive: Some(GoogleDriveConfig {
                client_id: "client-id".to_string(),
                client_secret: "oauth-client-secret".to_string(),
                refresh_token: "oauth-refresh-secret".to_string(),
                folder_id: "folder-id".to_string(),
            }),
        };

        let rendered = format!("{config:?}");
        for secret in [
            "s3-access-secret",
            "s3-secret-secret",
            "oauth-client-secret",
            "oauth-refresh-secret",
        ] {
            assert!(!rendered.contains(secret));
        }
        assert!(rendered.contains("[REDACTED]"));
    }

    #[test]
    fn storage_backend_has_stable_names() {
        assert_eq!(StorageBackend::Filesystem.as_str(), "filesystem");
        assert_eq!(StorageBackend::GoogleDrive.as_str(), "google_drive");
    }
}
