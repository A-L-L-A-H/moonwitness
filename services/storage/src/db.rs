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
    Ok(pool)
}

pub async fn init_db(url: &str) -> anyhow::Result<Pool> {
    let pool = SqlitePool::connect(url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}
