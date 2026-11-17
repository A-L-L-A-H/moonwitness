use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: i64,
    pub version: String,
    #[allow(dead_code)]
    #[serde(skip_serializing)]
    pub community: String,
    pub v3_username: Option<String>,
    pub v3_auth_protocol: Option<String>,
    #[allow(dead_code)]
    #[serde(skip_serializing)]
    pub v3_auth_passphrase: Option<String>,
    pub v3_priv_protocol: Option<String>,
    #[allow(dead_code)]
    #[serde(skip_serializing)]
    pub v3_priv_passphrase: Option<String>,
    pub enabled: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Target {
    pub id: String,
    pub device_id: String,
    pub name: String,
    pub oid: String,
    pub poll_interval: Option<i64>,
    pub enabled: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Sample {
    pub id: String,
    pub target_id: String,
    pub ts: i64,
    pub counter: i64,
    pub rate: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDeviceRequest {
    pub name: String,
    pub host: String,
    pub port: Option<i64>,
    pub version: Option<String>,
    pub community: Option<String>,
    pub v3_username: Option<String>,
    pub v3_auth_protocol: Option<String>,
    pub v3_auth_passphrase: Option<String>,
    pub v3_priv_protocol: Option<String>,
    pub v3_priv_passphrase: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTargetRequest {
    pub name: String,
    pub oid: String,
    pub poll_interval: Option<i64>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    pub total_devices: i64,
    pub enabled_devices: i64,
    pub total_targets: i64,
    pub total_samples: i64,
}

#[cfg(test)]
mod tests {
    use super::Device;

    #[test]
    fn device_serialization_never_exposes_community_credentials() {
        let device = Device {
            id: "device-1".to_string(),
            name: "router".to_string(),
            host: "192.0.2.1".to_string(),
            port: 161,
            version: "2c".to_string(),
            community: "private-community".to_string(),
            v3_username: None,
            v3_auth_protocol: None,
            v3_auth_passphrase: None,
            v3_priv_protocol: None,
            v3_priv_passphrase: None,
            enabled: true,
            created_at: 1,
        };

        let serialized = serde_json::to_value(device).expect("device serializes");
        assert!(serialized.get("community").is_none());
    }
}
