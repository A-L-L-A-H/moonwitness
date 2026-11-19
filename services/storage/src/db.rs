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
    let pool = SqlitePool::connect(url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::is_postgres_url;

    #[test]
    fn is_postgres_url_detects_postgres_schemes() {
        assert!(is_postgres_url(
            "postgres://storage:pass@postgres:5432/storage"
        ));
        assert!(is_postgres_url("postgresql://localhost:5432/storage"));
        assert!(!is_postgres_url("sqlite:/data/storage.db?mode=rwc"));
    }
}
