pub mod api;
pub mod config;
pub mod db;
pub mod error;
pub mod metrics;
pub mod models;
pub mod syslog;

use std::sync::Arc;

use axum::Router;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::config::Config;
use crate::db::init_db;
use crate::syslog::server::SyslogServer;

pub async fn run() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let pool = init_db(&config.database_url).await?;
    let state = Arc::new(config.clone());

    let server = SyslogServer::new(state, pool.clone());
    let metrics = server.metrics();
    let syslog_handle = server.start().await?;

    let app = Router::new()
        .merge(api::router_with_metrics(pool, metrics))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()),
        );

    let listener =
        tokio::net::TcpListener::bind(format!("{}:{}", config.host, config.http_port)).await?;
    tracing::info!(
        host = %config.host,
        http_port = config.http_port,
        syslog_udp_port = syslog_handle.udp_addr().port(),
        syslog_tcp_port = syslog_handle.tcp_addr().port(),
        "syslog service listening"
    );

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    syslog_handle.shutdown().await;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut sigterm) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            sigterm.recv().await;
        } else {
            std::future::pending::<()>().await;
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
