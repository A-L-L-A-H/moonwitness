//! Google Drive v3 storage adapter.
//!
//! Objects are addressed by their Drive file IDs in SQLite. Bucket/object names
//! remain owned by the S3 metadata index; Drive is only the blob backend.

use std::path::Path;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::{anyhow, Context, Result};
use reqwest::header::{CONTENT_RANGE, CONTENT_TYPE, LOCATION};
use serde::Deserialize;
use serde_json::json;
use tokio::io::AsyncReadExt;
use tokio::sync::Mutex;

use crate::config::GoogleDriveConfig;

const DRIVE_API: &str = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API: &str = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_ENDPOINT: &str = "https://oauth2.googleapis.com/token";
const CHUNK_SIZE: u64 = 8 * 1024 * 1024;

#[derive(Clone)]
pub struct GoogleDrive {
    client: reqwest::Client,
    config: GoogleDriveConfig,
    token: Arc<Mutex<Option<CachedToken>>>,
}

struct CachedToken {
    value: String,
    expires_at: Instant,
}

#[derive(Deserialize)]
struct OAuthToken {
    access_token: String,
    expires_in: Option<u64>,
}

#[derive(Deserialize)]
struct DriveFile {
    id: String,
}

impl GoogleDrive {
    pub fn new(config: GoogleDriveConfig) -> Self {
        Self {
            client: reqwest::Client::new(),
            config,
            token: Arc::new(Mutex::new(None)),
        }
    }

    async fn access_token(&self) -> Result<String> {
        let mut cached = self.token.lock().await;
        if let Some(token) = cached.as_ref() {
            if token.expires_at > Instant::now() + Duration::from_secs(60) {
                return Ok(token.value.clone());
            }
        }

        let response = self
            .client
            .post(TOKEN_ENDPOINT)
            .form(&[
                ("client_id", self.config.client_id.as_str()),
                ("client_secret", self.config.client_secret.as_str()),
                ("refresh_token", self.config.refresh_token.as_str()),
                ("grant_type", "refresh_token"),
            ])
            .send()
            .await
            .context("failed to refresh Google OAuth token")?;

        if !response.status().is_success() {
            return Err(Self::response_error(response).await);
        }

        let token: OAuthToken = response
            .json()
            .await
            .context("Google OAuth token response was invalid")?;
        let expires_in = token.expires_in.unwrap_or(3600).max(60);
        *cached = Some(CachedToken {
            value: token.access_token.clone(),
            expires_at: Instant::now() + Duration::from_secs(expires_in),
        });
        Ok(token.access_token)
    }

    async fn create_file(
        &self,
        bucket: &str,
        key: &str,
        content_type: &str,
    ) -> Result<String> {
        let token = self.access_token().await?;
        let display_name = key
            .rsplit('/')
            .next()
            .filter(|name| !name.is_empty())
            .unwrap_or(key);
        let metadata = json!({
            "name": display_name,
            "mimeType": content_type,
            "parents": [self.config.folder_id],
            "appProperties": {
                "mw_source": "moonwitness-storage",
                "mw_bucket": bucket
            }
        });

        let response = self
            .client
            .post(format!("{DRIVE_API}/files"))
            .query(&[("fields", "id"), ("supportsAllDrives", "true")])
            .bearer_auth(token)
            .json(&metadata)
            .send()
            .await
            .context("failed to create Google Drive object metadata")?;

        if !response.status().is_success() {
            return Err(Self::response_error(response).await);
        }

        let file: DriveFile = response
            .json()
            .await
            .context("Google Drive did not return a file ID")?;
        Ok(file.id)
    }

    /// Creates a Drive file and uploads content with resumable 8 MiB chunks.
    pub async fn upload_path(
        &self,
        bucket: &str,
        key: &str,
        content_type: &str,
        path: &Path,
    ) -> Result<String> {
        let size = tokio::fs::metadata(path)
            .await
            .with_context(|| format!("cannot stat staged object {}", path.display()))?
            .len();
        let file_id = self.create_file(bucket, key, content_type).await?;

        if size > 0 {
            if let Err(error) = self.upload_content(&file_id, content_type, path, size).await {
                let _ = self.delete_file(&file_id).await;
                return Err(error);
            }
        }

        Ok(file_id)
    }

    async fn upload_content(
        &self,
        file_id: &str,
        content_type: &str,
        path: &Path,
        total: u64,
    ) -> Result<()> {
        let token = self.access_token().await?;
        let response = self
            .client
            .patch(format!("{DRIVE_UPLOAD_API}/files/{file_id}"))
            .query(&[
                ("uploadType", "resumable"),
                ("supportsAllDrives", "true"),
            ])
            .bearer_auth(&token)
            .header(CONTENT_TYPE, "application/json; charset=UTF-8")
            .header("x-upload-content-type", content_type)
            .header("x-upload-content-length", total.to_string())
            .body("{}")
            .send()
            .await
            .context("failed to start Google Drive resumable upload")?;

        if !response.status().is_success() {
            return Err(Self::response_error(response).await);
        }

        let session_url = response
            .headers()
            .get(LOCATION)
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| anyhow!("Google Drive resumable upload response omitted Location"))?
            .to_string();

        let mut file = tokio::fs::File::open(path)
            .await
            .with_context(|| format!("cannot open staged object {}", path.display()))?;
        let mut offset = 0_u64;

        while offset < total {
            let chunk_len = (total - offset).min(CHUNK_SIZE) as usize;
            let mut chunk = vec![0_u8; chunk_len];
            file.read_exact(&mut chunk)
                .await
                .context("failed to read staged object chunk")?;

            let end = offset + chunk_len as u64 - 1;
            let is_last = end + 1 == total;
            let response = self
                .client
                .put(&session_url)
                .bearer_auth(&token)
                .header(CONTENT_RANGE, format!("bytes {offset}-{end}/{total}"))
                .body(chunk)
                .send()
                .await
                .context("Google Drive resumable chunk upload failed")?;

            let status = response.status();
            if is_last {
                if !status.is_success() {
                    return Err(Self::response_error(response).await);
                }
            } else if status != reqwest::StatusCode::PERMANENT_REDIRECT {
                return Err(Self::response_error(response).await);
            }

            offset = end + 1;
        }

        Ok(())
    }

    pub async fn download_file(&self, file_id: &str) -> Result<Vec<u8>> {
        let token = self.access_token().await?;
        let response = self
            .client
            .get(format!("{DRIVE_API}/files/{file_id}"))
            .query(&[("alt", "media"), ("supportsAllDrives", "true")])
            .bearer_auth(token)
            .send()
            .await
            .context("failed to download Google Drive object")?;

        if !response.status().is_success() {
            return Err(Self::response_error(response).await);
        }

        Ok(response
            .bytes()
            .await
            .context("failed to read Google Drive object body")?
            .to_vec())
    }

    pub async fn delete_file(&self, file_id: &str) -> Result<()> {
        let token = self.access_token().await?;
        let response = self
            .client
            .delete(format!("{DRIVE_API}/files/{file_id}"))
            .query(&[("supportsAllDrives", "true")])
            .bearer_auth(token)
            .send()
            .await
            .context("failed to delete Google Drive object")?;

        if response.status().is_success() || response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(());
        }

        Err(Self::response_error(response).await)
    }

    async fn response_error(response: reqwest::Response) -> anyhow::Error {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        let detail: String = body.chars().take(1200).collect();
        anyhow!("Google Drive API returned {status}: {detail}")
    }
}
