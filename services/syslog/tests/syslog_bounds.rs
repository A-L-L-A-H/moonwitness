//! Integration tests for bounded Syslog TCP ingestion, timeouts, connection limits,
//! batch retention pruning outside the hot path, metrics exposure, and clean shutdown.

use std::future::Future;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use sqlx::Row;
use syslog::api;
use syslog::config::Config;
use syslog::db::{self, Pool};
use syslog::metrics::MetricsSnapshot;
use syslog::syslog::server::{SyslogHandle, SyslogServer};
use tempfile::TempDir;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream, UdpSocket};

struct TestHarness {
    _dir: TempDir,
    pool: Pool,
    handle: Option<SyslogHandle>,
}

impl TestHarness {
    async fn start(mut config: Config) -> Self {
        let dir = tempfile::tempdir().expect("tempdir");
        let db_path = dir.path().join("syslog-test.db");
        config.host = "127.0.0.1".to_string();
        config.syslog_udp_port = 0;
        config.syslog_tcp_port = 0;
        config.http_port = 0;
        config.database_url = format!("sqlite:{}?mode=rwc", db_path.display());

        let pool = db::init_db(&config.database_url).await.expect("init_db");
        let server = SyslogServer::new(Arc::new(config), pool.clone());
        let handle = server.start().await.expect("start syslog server");

        Self {
            _dir: dir,
            pool,
            handle: Some(handle),
        }
    }

    fn handle(&self) -> &SyslogHandle {
        self.handle.as_ref().expect("server still running")
    }

    fn tcp_addr(&self) -> SocketAddr {
        self.handle().tcp_addr()
    }

    fn udp_addr(&self) -> SocketAddr {
        self.handle().udp_addr()
    }

    fn snapshot(&self) -> MetricsSnapshot {
        self.handle().metrics().snapshot()
    }

    async fn message_count(&self) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM syslog_messages")
            .fetch_one(&self.pool)
            .await
            .expect("count query")
    }

    async fn messages_ordered_oldest_first(&self) -> Vec<String> {
        let rows = sqlx::query("SELECT message FROM syslog_messages ORDER BY rowid ASC")
            .fetch_all(&self.pool)
            .await
            .expect("select messages");
        rows.into_iter().map(|r| r.get::<String, _>(0)).collect()
    }

    async fn shutdown(&mut self) -> Arc<syslog::metrics::SyslogMetrics> {
        let handle = self.handle.take().expect("already shut down");
        let metrics = handle.metrics().clone();
        handle.shutdown().await;
        metrics
    }
}

async fn wait_until<F, Fut>(timeout: Duration, mut pred: F)
where
    F: FnMut() -> Fut,
    Fut: Future<Output = bool>,
{
    let deadline = Instant::now() + timeout;
    loop {
        if pred().await {
            return;
        }
        assert!(
            Instant::now() < deadline,
            "condition not met within {timeout:?}"
        );
        tokio::time::sleep(Duration::from_millis(15)).await;
    }
}

async fn assert_stream_closed_by_peer(stream: &mut TcpStream) {
    let mut buf = [0u8; 64];
    let res = tokio::time::timeout(Duration::from_secs(3), stream.read(&mut buf))
        .await
        .expect("peer did not close connection within timeout");
    match res {
        Ok(0) => {}
        Err(e)
            if matches!(
                e.kind(),
                std::io::ErrorKind::ConnectionReset
                    | std::io::ErrorKind::ConnectionAborted
                    | std::io::ErrorKind::BrokenPipe
            ) => {}
        other => panic!("expected EOF or connection reset, got: {other:?}"),
    }
}

#[tokio::test]
async fn rejects_oversized_tcp_frames_without_truncation() {
    let config = Config {
        max_tcp_frame_bytes: 128,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    // 1. Valid frame followed by an oversized line-delimited frame (> 128 bytes).
    let mut conn1 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn1.write_all(b"<14>valid-before\n").await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 1
    })
    .await;

    let oversized_line = format!("<14>{}\n", "x".repeat(200));
    let _ = conn1.write_all(oversized_line.as_bytes()).await;
    assert_stream_closed_by_peer(&mut conn1).await;

    wait_until(Duration::from_secs(2), || async {
        let snap = harness.snapshot();
        snap.tcp_frames_rejected_oversized_total == 1 && snap.tcp_connections_active == 0
    })
    .await;
    assert_eq!(harness.message_count().await, 1);

    // 2. Streaming oversized bytes without newline is rejected immediately without buffering unboundedly.
    let mut conn2 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    let _ = conn2.write_all(&vec![b'a'; 256]).await;
    assert_stream_closed_by_peer(&mut conn2).await;

    wait_until(Duration::from_secs(2), || async {
        let snap = harness.snapshot();
        snap.tcp_frames_rejected_oversized_total == 2 && snap.tcp_connections_active == 0
    })
    .await;
    assert_eq!(harness.message_count().await, 1);

    // 3. Exact boundary (128 bytes total including `\n`) succeeds; 129 bytes is rejected.
    let exact_payload = "b".repeat(128 - 5);
    let exact_frame = format!("<14>{exact_payload}\n");
    assert_eq!(exact_frame.len(), 128);

    let mut conn3 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn3.write_all(exact_frame.as_bytes()).await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 2
    })
    .await;

    let over_one = format!("<14>{}\n", "c".repeat(128 - 4));
    assert_eq!(over_one.len(), 129);
    let _ = conn3.write_all(over_one.as_bytes()).await;
    assert_stream_closed_by_peer(&mut conn3).await;

    wait_until(Duration::from_secs(2), || async {
        let snap = harness.snapshot();
        snap.tcp_frames_rejected_oversized_total == 3 && snap.tcp_connections_active == 0
    })
    .await;

    let messages = harness.messages_ordered_oldest_first().await;
    assert_eq!(messages, vec!["valid-before".to_string(), exact_payload]);

    harness.shutdown().await;
}

#[tokio::test]
async fn rejects_invalid_utf8_tcp_frame() {
    let mut harness = TestHarness::start(Config::default()).await;

    let mut conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn.write_all(b"<14>\xff\xfe\xfd\n").await.unwrap();
    assert_stream_closed_by_peer(&mut conn).await;

    wait_until(Duration::from_secs(2), || async {
        let snap = harness.snapshot();
        snap.tcp_frames_rejected_invalid_utf8_total == 1 && snap.tcp_connections_active == 0
    })
    .await;
    assert_eq!(harness.message_count().await, 0);

    harness.shutdown().await;
}

#[tokio::test]
async fn closes_idle_and_stalled_slow_clients_on_read_timeout() {
    let config = Config {
        tcp_read_timeout_secs: 1,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    // 1. Completely idle connection sending 0 bytes.
    let mut idle_conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    assert_stream_closed_by_peer(&mut idle_conn).await;

    // 2. Stalled connection sending an incomplete frame without newline.
    let mut stalled_conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    stalled_conn
        .write_all(b"<14>1 2026-11-17T00:00:00Z h app - - incomplete")
        .await
        .unwrap();
    assert_stream_closed_by_peer(&mut stalled_conn).await;

    // 3. Slowloris drip client trickling 1 byte every 250ms without finishing frame in 1s.
    let mut drip_conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    let _ = drip_conn.write_all(b"<14>drip").await;
    for _ in 0..8 {
        tokio::time::sleep(Duration::from_millis(250)).await;
        if drip_conn.write_all(b"x").await.is_err() {
            break;
        }
    }
    assert_stream_closed_by_peer(&mut drip_conn).await;

    wait_until(Duration::from_secs(2), || async {
        let snap = harness.snapshot();
        snap.tcp_connections_timed_out_total == 3 && snap.tcp_connections_active == 0
    })
    .await;

    // Partial frames from stalled/slow clients must never be ingested.
    assert_eq!(harness.message_count().await, 0);

    harness.shutdown().await;
}

#[tokio::test]
async fn enforces_tcp_connection_semaphore_saturation_and_recovers() {
    let config = Config {
        max_tcp_connections: 2,
        max_tcp_connections_per_ip: 10,
        tcp_read_timeout_secs: 10,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    let mut conn1 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    let _conn2 = TcpStream::connect(harness.tcp_addr()).await.unwrap();

    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().tcp_connections_active == 2
    })
    .await;

    conn1.write_all(b"<14>from-conn1\n").await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 1
    })
    .await;

    // 3rd connection exceeds global semaphore capacity and must be rejected immediately.
    let mut conn3 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    let _ = conn3.write_all(b"<14>must-be-rejected\n").await;
    assert_stream_closed_by_peer(&mut conn3).await;

    let snap = harness.snapshot();
    assert!(snap.tcp_connections_rejected_limit_total >= 1);
    assert_eq!(
        snap.tcp_connections_rejected_total,
        snap.tcp_connections_rejected_limit_total
    );
    assert_eq!(snap.tcp_connections_active, 2);
    assert_eq!(harness.message_count().await, 1);

    // Releasing conn1 frees a semaphore permit for conn4.
    drop(conn1);
    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().tcp_connections_active == 1
    })
    .await;

    let mut conn4 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn4.write_all(b"<14>from-conn4\n").await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 2
    })
    .await;

    let messages = harness.messages_ordered_oldest_first().await;
    assert_eq!(
        messages,
        vec!["from-conn1".to_string(), "from-conn4".to_string()]
    );

    harness.shutdown().await;
}

#[tokio::test]
async fn enforces_per_ip_connection_limit_before_global_saturation() {
    let config = Config {
        max_tcp_connections: 16,
        max_tcp_connections_per_ip: 2,
        tcp_read_timeout_secs: 10,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    let _conn1 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    let _conn2 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().tcp_connections_active == 2
    })
    .await;

    let mut conn3 = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    assert_stream_closed_by_peer(&mut conn3).await;

    let snap = harness.snapshot();
    assert!(snap.tcp_connections_rejected_per_ip_total >= 1);
    assert_eq!(snap.tcp_connections_rejected_limit_total, 0);
    assert_eq!(snap.tcp_connections_active, 2);

    harness.shutdown().await;
}

#[tokio::test]
async fn prunes_retention_in_bounded_batches_outside_hot_path() {
    let config = Config {
        max_messages: 10,
        retention_prune_threshold: 12,
        retention_prune_interval_secs: 60,
        retention_prune_batch_size: 4,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    let mut conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    for i in 1..=11 {
        conn.write_all(format!("<14>msg-{i:02}\n").as_bytes())
            .await
            .unwrap();
    }

    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 11
    })
    .await;

    // Hot path must NOT run retention DELETE on each ingest even when count (11) > max_messages (10).
    let snap_before = harness.snapshot();
    assert_eq!(snap_before.messages_ingested_total, 11);
    assert_eq!(snap_before.retention_prune_runs_total, 0);
    assert_eq!(snap_before.retention_prune_batches_total, 0);
    assert_eq!(snap_before.retention_prune_rows_deleted_total, 0);

    // Sending 7 more crosses retention_prune_threshold=12 (total 18 ingested -> 8 excess).
    for i in 12..=18 {
        conn.write_all(format!("<14>msg-{i:02}\n").as_bytes())
            .await
            .unwrap();
    }

    wait_until(Duration::from_secs(3), || async {
        let snap = harness.snapshot();
        snap.messages_ingested_total == 18
            && snap.retention_prune_rows_deleted_total == 8
            && harness.message_count().await == 10
    })
    .await;

    let snap_after = harness.snapshot();
    assert!(snap_after.retention_prune_runs_total >= 1);
    // 8 excess rows with batch_size=4 must delete in 2 bounded chunks, not 1 full-table DELETE.
    assert_eq!(snap_after.retention_prune_batches_total, 2);

    let remaining = harness.messages_ordered_oldest_first().await;
    let expected: Vec<String> = (9..=18).map(|i| format!("msg-{i:02}")).collect();
    assert_eq!(remaining, expected);

    harness.shutdown().await;
}

#[tokio::test]
async fn prunes_retention_on_periodic_interval_and_respects_zero_disable() {
    // Part A: periodic timer sweep when threshold is not hit.
    let config = Config {
        max_messages: 5,
        retention_prune_threshold: 1000,
        retention_prune_interval_secs: 1,
        retention_prune_batch_size: 2,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;

    let mut conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    for i in 1..=9 {
        conn.write_all(format!("<14>tick-{i:02}\n").as_bytes())
            .await
            .unwrap();
    }

    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 9
    })
    .await;
    assert_eq!(harness.snapshot().retention_prune_batches_total, 0);

    wait_until(Duration::from_secs(3), || async {
        harness.snapshot().retention_prune_rows_deleted_total == 4
            && harness.message_count().await == 5
    })
    .await;
    assert_eq!(harness.snapshot().retention_prune_batches_total, 2);
    harness.shutdown().await;

    // Part B: max_messages = 0 disables pruning completely.
    let disabled_cfg = Config {
        max_messages: 0,
        retention_prune_threshold: 2,
        retention_prune_interval_secs: 1,
        retention_prune_batch_size: 2,
        ..Default::default()
    };
    let mut disabled = TestHarness::start(disabled_cfg).await;
    let mut conn2 = TcpStream::connect(disabled.tcp_addr()).await.unwrap();
    for i in 1..=8 {
        conn2
            .write_all(format!("<14>keep-{i:02}\n").as_bytes())
            .await
            .unwrap();
    }
    wait_until(Duration::from_secs(2), || async {
        disabled.message_count().await == 8
    })
    .await;
    tokio::time::sleep(Duration::from_millis(1200)).await;
    assert_eq!(disabled.message_count().await, 8);
    assert_eq!(disabled.snapshot().retention_prune_runs_total, 0);
    disabled.shutdown().await;
}

#[tokio::test]
async fn clean_shutdown_cancels_active_tcp_tasks_and_flushes_retention() {
    let config = Config {
        max_messages: 4,
        retention_prune_threshold: 1000,
        retention_prune_interval_secs: 60,
        retention_prune_batch_size: 2,
        tcp_read_timeout_secs: 30,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;
    let tcp_addr = harness.tcp_addr();

    let mut c1 = TcpStream::connect(tcp_addr).await.unwrap();
    let mut c2 = TcpStream::connect(tcp_addr).await.unwrap();
    let _c3 = TcpStream::connect(tcp_addr).await.unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().tcp_connections_active == 3
    })
    .await;

    for i in 1..=3 {
        c1.write_all(format!("<14>tcp-a-{i}\n").as_bytes())
            .await
            .unwrap();
        c2.write_all(format!("<14>tcp-b-{i}\n").as_bytes())
            .await
            .unwrap();
    }
    let udp = UdpSocket::bind("127.0.0.1:0").await.unwrap();
    udp.send_to(b"<14>udp-last", harness.udp_addr())
        .await
        .unwrap();

    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 7
    })
    .await;

    // Shutdown must complete promptly instead of waiting 30s read timeout or 60s prune tick.
    let pool = harness.pool.clone();
    let metrics = tokio::time::timeout(Duration::from_secs(3), harness.shutdown())
        .await
        .expect("shutdown timed out with orphaned tasks");

    let snap = metrics.snapshot();
    assert_eq!(snap.tcp_connections_active, 0);
    assert_eq!(snap.tcp_messages_ingested_total, 6);
    assert_eq!(snap.udp_messages_ingested_total, 1);
    assert_eq!(snap.retention_prune_rows_deleted_total, 3);

    let remaining: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM syslog_messages")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(remaining, 4);

    // Listener must no longer accept connections after shutdown.
    assert!(TcpStream::connect(tcp_addr).await.is_err());
}

#[tokio::test]
async fn records_ingest_errors_when_database_write_fails() {
    let mut harness = TestHarness::start(Config::default()).await;
    // Simulate DB failure on write by closing the pool prior to incoming TCP log.
    harness.pool.close().await;

    let mut conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn.write_all(b"<14>db-closed-message\n").await.unwrap();
    conn.shutdown().await.unwrap();

    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().ingest_errors_total == 1
    })
    .await;

    let snap = harness.snapshot();
    assert_eq!(snap.messages_ingested_total, 0);
    assert_eq!(snap.ingest_errors_total, 1);

    harness.shutdown().await;
}

#[tokio::test]
async fn exposes_metrics_and_stats_endpoints_over_http() {
    let config = Config {
        max_tcp_frame_bytes: 64,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;
    let metrics = harness.handle().metrics().clone();

    let app = api::router_with_metrics(harness.pool.clone(), metrics);
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let http_addr = listener.local_addr().unwrap();
    let http_task = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    // Generate 1 valid message and 1 oversized frame rejection.
    let mut conn = TcpStream::connect(harness.tcp_addr()).await.unwrap();
    conn.write_all(b"<34>1 2026-11-17T08:00:00Z gw app 1 - ok\n")
        .await
        .unwrap();
    wait_until(Duration::from_secs(2), || async {
        harness.message_count().await == 1
    })
    .await;
    let _ = conn
        .write_all(format!("{}\n", "z".repeat(128)).as_bytes())
        .await;
    assert_stream_closed_by_peer(&mut conn).await;
    wait_until(Duration::from_secs(2), || async {
        harness.snapshot().tcp_frames_rejected_oversized_total == 1
    })
    .await;

    let json_resp = http_get(http_addr, "/api/metrics").await;
    assert!(json_resp.starts_with("HTTP/1.1 200 OK"));
    let json_body: serde_json::Value =
        serde_json::from_str(http_body(&json_resp)).expect("valid json metrics");
    assert_eq!(json_body["messages_ingested_total"], 1);
    assert_eq!(json_body["tcp_frames_rejected_oversized_total"], 1);
    assert_eq!(json_body["tcp_connections_accepted_total"], 1);
    assert_eq!(json_body["tcp_connections_active"], 0);

    let prom_resp = http_get(http_addr, "/metrics").await;
    assert!(prom_resp.starts_with("HTTP/1.1 200 OK"));
    assert!(prom_resp.contains("syslog_messages_ingested_total 1"));
    assert!(prom_resp.contains("syslog_tcp_frames_rejected_oversized_total 1"));
    assert!(prom_resp.contains("syslog_retention_prune_batches_total 0"));

    let stats_resp = http_get(http_addr, "/api/stats").await;
    let stats_body: serde_json::Value =
        serde_json::from_str(http_body(&stats_resp)).expect("valid json stats");
    assert_eq!(stats_body["total_messages"], 1);
    assert_eq!(stats_body["metrics"]["messages_ingested_total"], 1);

    http_task.abort();
    harness.shutdown().await;
}

#[tokio::test]
async fn sustained_load_records_throughput_latency_and_prune_frequency() {
    let total_messages = 2_000usize;
    let config = Config {
        max_messages: 500,
        retention_prune_threshold: 500,
        retention_prune_interval_secs: 10,
        retention_prune_batch_size: 250,
        max_tcp_connections: 64,
        max_tcp_connections_per_ip: 16,
        ..Default::default()
    };
    let mut harness = TestHarness::start(config).await;
    let tcp_addr = harness.tcp_addr();

    let started = Instant::now();
    let workers = 4usize;
    let per_worker = total_messages / workers;
    let mut tasks = Vec::new();
    for worker_id in 0..workers {
        tasks.push(tokio::spawn(async move {
            let mut conn = TcpStream::connect(tcp_addr).await.unwrap();
            let mut batch = String::new();
            for seq in 0..per_worker {
                batch.push_str(&format!(
                    "<34>1 2026-11-17T08:00:00Z node-{worker_id} syslogd 100 - load-{worker_id}-{seq}\n"
                ));
            }
            conn.write_all(batch.as_bytes()).await.unwrap();
            conn.shutdown().await.unwrap();
        }));
    }
    for task in tasks {
        task.await.unwrap();
    }

    wait_until(Duration::from_secs(15), || async {
        harness.snapshot().messages_ingested_total == total_messages as u64
    })
    .await;
    let ingest_elapsed = started.elapsed();

    let pool = harness.pool.clone();
    let metrics = harness.shutdown().await;
    let snap = metrics.snapshot();

    let final_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM syslog_messages")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(snap.messages_ingested_total, total_messages as u64);
    assert_eq!(snap.ingest_errors_total, 0);
    assert_eq!(final_count, 500);
    assert_eq!(snap.retention_prune_rows_deleted_total, 1_500);
    assert!(
        snap.retention_prune_runs_total <= 8,
        "expected infrequent batch prune sweeps, got {}",
        snap.retention_prune_runs_total
    );

    let throughput = total_messages as f64 / ingest_elapsed.as_secs_f64();
    eprintln!(
        "sustained_load: msgs={total_messages}, wall_ms={:.1}, throughput={throughput:.1} msg/s, \
         avg_ingest_us={:.1}, max_ingest_us={}, prune_runs={}, prune_batches={}, rows_deleted={}",
        ingest_elapsed.as_secs_f64() * 1000.0,
        snap.ingest_latency_avg_micros,
        snap.ingest_duration_micros_max,
        snap.retention_prune_runs_total,
        snap.retention_prune_batches_total,
        snap.retention_prune_rows_deleted_total,
    );
}

async fn http_get(addr: SocketAddr, path: &str) -> String {
    let mut stream = TcpStream::connect(addr).await.unwrap();
    let req = format!("GET {path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
    stream.write_all(req.as_bytes()).await.unwrap();
    let mut resp = String::new();
    stream.read_to_string(&mut resp).await.unwrap();
    resp
}

fn http_body(resp: &str) -> &str {
    resp.split_once("\r\n\r\n")
        .map(|(_, body)| body)
        .unwrap_or("")
}
