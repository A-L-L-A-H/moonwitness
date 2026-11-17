use sqlx::SqlitePool;

pub type Pool = SqlitePool;

pub async fn init_db(url: &str) -> anyhow::Result<Pool> {
    let pool = SqlitePool::connect(url).await?;
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
}
