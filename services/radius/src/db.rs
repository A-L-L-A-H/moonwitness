use std::str::FromStr;
use std::time::Duration;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;

pub type Pool = SqlitePool;

#[allow(dead_code)]
pub fn is_postgres_url(url: &str) -> bool {
    url.starts_with("postgres://") || url.starts_with("postgresql://")
}

#[allow(dead_code)]
pub async fn init_postgres_pool(url: &str) -> anyhow::Result<sqlx::PgPool> {
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(url)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

pub async fn init_db(url: &str) -> anyhow::Result<Pool> {
    let options = SqliteConnectOptions::from_str(url)?
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5))
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new().connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn init_db_applies_migrations_on_new_database() {
        let dir = std::env::temp_dir().join(format!("mw-radius-db-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let db_path = dir.join("radius.db");
        let url = format!("sqlite:{}?mode=rwc", db_path.display());

        let pool = init_db(&url).await.unwrap();
        let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(&pool)
            .await
            .unwrap();
        let log_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM radius_logs")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(user_count, 0);
        assert_eq!(log_count, 0);

        pool.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn init_db_fails_closed_for_missing_parent_directory() {
        let missing = std::env::temp_dir()
            .join(format!("mw-radius-missing-{}", uuid::Uuid::new_v4()))
            .join("nested")
            .join("radius.db");
        let url = format!("sqlite:{}?mode=rwc", missing.display());
        assert!(init_db(&url).await.is_err());
    }

    #[test]
    fn is_postgres_url_detects_postgres_schemes() {
        assert!(is_postgres_url("postgres://radius:pass@postgres:5432/radius"));
        assert!(is_postgres_url("postgresql://postgres:5432/radius"));
        assert!(!is_postgres_url("sqlite:/data/radius.db?mode=rwc"));
    }
}
