//! UDP and TCP syslog listeners with bounded framing, connection limits,
//! idle timeouts, orderly shutdown, and background batch retention pruning.

use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use bytes::BytesMut;
use tokio::io::AsyncReadExt;
use tokio::net::{TcpListener, TcpStream, UdpSocket};
use tokio::sync::{watch, Notify, OwnedSemaphorePermit, Semaphore};
use tokio::task::{JoinHandle, JoinSet};

use crate::config::Config;
use crate::db::Pool;
use crate::metrics::SyslogMetrics;
use crate::syslog::parser;

const MAX_UDP_PACKET: usize = 64 * 1024;
const MAX_CHUNKS_PER_PRUNE_PASS: usize = 50;
const SHUTDOWN_DRAIN_TIMEOUT: Duration = Duration::from_secs(5);

pub struct SyslogServer {
    config: Arc<Config>,
    pool: Pool,
    metrics: Arc<SyslogMetrics>,
}

impl SyslogServer {
    pub fn new(config: Arc<Config>, pool: Pool) -> Self {
        Self::with_metrics(config, pool, Arc::new(SyslogMetrics::new()))
    }

    pub fn with_metrics(config: Arc<Config>, pool: Pool, metrics: Arc<SyslogMetrics>) -> Self {
        SyslogServer {
            config,
            pool,
            metrics,
        }
    }

    pub fn metrics(&self) -> Arc<SyslogMetrics> {
        self.metrics.clone()
    }

    pub async fn start(self) -> anyhow::Result<SyslogHandle> {
        let udp_bind = format!("{}:{}", self.config.host, self.config.syslog_udp_port);
        let udp_socket = UdpSocket::bind(&udp_bind)
            .await
            .map_err(|e| anyhow::anyhow!("failed to bind syslog UDP socket {udp_bind}: {e}"))?;
        let udp_addr = udp_socket.local_addr()?;

        let tcp_bind = format!("{}:{}", self.config.host, self.config.syslog_tcp_port);
        let tcp_listener = TcpListener::bind(&tcp_bind)
            .await
            .map_err(|e| anyhow::anyhow!("failed to bind syslog TCP socket {tcp_bind}: {e}"))?;
        let tcp_addr = tcp_listener.local_addr()?;

        tracing::info!(%udp_addr, %tcp_addr, "syslog listeners bound");

        let (shutdown_tx, shutdown_rx) = watch::channel(false);
        let prune_notify = Arc::new(Notify::new());

        let udp_task = tokio::spawn(run_udp(
            udp_socket,
            self.config.clone(),
            self.pool.clone(),
            self.metrics.clone(),
            prune_notify.clone(),
            shutdown_rx.clone(),
        ));
        let tcp_task = tokio::spawn(run_tcp(
            tcp_listener,
            self.config.clone(),
            self.pool.clone(),
            self.metrics.clone(),
            prune_notify.clone(),
            shutdown_rx.clone(),
        ));
        let prune_task = tokio::spawn(run_retention_pruner(
            self.config,
            self.pool,
            self.metrics.clone(),
            prune_notify,
            shutdown_rx,
        ));

        Ok(SyslogHandle {
            udp_addr,
            tcp_addr,
            metrics: self.metrics,
            shutdown_tx,
            tasks: vec![udp_task, tcp_task, prune_task],
        })
    }
}

pub struct SyslogHandle {
    udp_addr: SocketAddr,
    tcp_addr: SocketAddr,
    metrics: Arc<SyslogMetrics>,
    shutdown_tx: watch::Sender<bool>,
    tasks: Vec<JoinHandle<()>>,
}

impl SyslogHandle {
    pub fn udp_addr(&self) -> SocketAddr {
        self.udp_addr
    }

    pub fn tcp_addr(&self) -> SocketAddr {
        self.tcp_addr
    }

    pub fn metrics(&self) -> &Arc<SyslogMetrics> {
        &self.metrics
    }

    pub async fn shutdown(mut self) {
        let _ = self.shutdown_tx.send(true);
        let tasks = std::mem::take(&mut self.tasks);
        for task in tasks {
            let _ = task.await;
        }
    }
}

impl Drop for SyslogHandle {
    fn drop(&mut self) {
        let _ = self.shutdown_tx.send(true);
    }
}

async fn wait_for_shutdown(rx: &mut watch::Receiver<bool>) {
    if *rx.borrow_and_update() {
        return;
    }
    while rx.changed().await.is_ok() {
        if *rx.borrow() {
            return;
        }
    }
}

async fn run_udp(
    socket: UdpSocket,
    config: Arc<Config>,
    pool: Pool,
    metrics: Arc<SyslogMetrics>,
    prune_notify: Arc<Notify>,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    tracing::info!(addr = %socket.local_addr().map_or_else(|_| "unknown".to_string(), |a| a.to_string()), "syslog UDP listener started");

    let mut buf = vec![0u8; MAX_UDP_PACKET];
    loop {
        let (n, peer) = tokio::select! {
            biased;
            _ = wait_for_shutdown(&mut shutdown_rx) => break,
            res = socket.recv_from(&mut buf) => match res {
                Ok(v) => v,
                Err(e) => {
                    metrics.record_udp_recv_error();
                    tracing::error!(error = %e, "syslog UDP recv error");
                    continue;
                }
            }
        };
        let raw = String::from_utf8_lossy(&buf[..n]);
        if let Err(e) = ingest(
            &pool,
            &config,
            &metrics,
            &prune_notify,
            "udp",
            Some(peer.ip().to_string()),
            &raw,
        )
        .await
        {
            tracing::warn!(error = %e, %peer, "failed to ingest syslog UDP message");
        }
    }
}

async fn run_tcp(
    listener: TcpListener,
    config: Arc<Config>,
    pool: Pool,
    metrics: Arc<SyslogMetrics>,
    prune_notify: Arc<Notify>,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    let max_connections = config.max_tcp_connections.max(1);
    let max_per_ip = config.max_tcp_connections_per_ip.max(1);
    let semaphore = Arc::new(Semaphore::new(max_connections));
    let source_tracker = SourceConnectionTracker::new(max_per_ip);
    let mut conn_tasks = JoinSet::new();

    tracing::info!(
        addr = %listener.local_addr().map_or_else(|_| "unknown".to_string(), |a| a.to_string()),
        max_connections,
        max_per_ip,
        max_frame_bytes = config.max_tcp_frame_bytes.max(1),
        read_timeout_secs = config.tcp_read_timeout().as_secs(),
        "syslog TCP listener started"
    );

    loop {
        tokio::select! {
            biased;
            _ = wait_for_shutdown(&mut shutdown_rx) => break,
            Some(res) = conn_tasks.join_next(), if !conn_tasks.is_empty() => {
                if let Err(e) = res {
                    if !e.is_cancelled() {
                        tracing::error!(error = %e, "syslog TCP connection task panicked");
                    }
                }
            }
            accepted = listener.accept() => {
                let (stream, peer) = match accepted {
                    Ok(v) => v,
                    Err(e) => {
                        tracing::error!(error = %e, "syslog TCP accept error");
                        continue;
                    }
                };

                let Ok(permit) = semaphore.clone().try_acquire_owned() else {
                    metrics.record_tcp_rejected_limit();
                    tracing::warn!(
                        %peer,
                        max_connections,
                        "rejecting syslog TCP connection: max_tcp_connections reached"
                    );
                    drop(stream);
                    continue;
                };

                let Some(guard) = source_tracker.try_acquire(peer.ip(), permit, metrics.clone()) else {
                    metrics.record_tcp_rejected_per_ip();
                    tracing::warn!(
                        %peer,
                        max_per_ip,
                        "rejecting syslog TCP connection: max_tcp_connections_per_ip reached"
                    );
                    drop(stream);
                    continue;
                };

                let pool = pool.clone();
                let config = config.clone();
                let metrics = metrics.clone();
                let prune_notify = prune_notify.clone();
                let conn_shutdown = shutdown_rx.clone();

                conn_tasks.spawn(async move {
                    handle_tcp_connection(
                        stream,
                        peer,
                        config,
                        pool,
                        metrics,
                        prune_notify,
                        conn_shutdown,
                        guard,
                    )
                    .await;
                });
            }
        }
    }

    drop(listener);
    let drain = async {
        while let Some(res) = conn_tasks.join_next().await {
            if let Err(e) = res {
                if !e.is_cancelled() {
                    tracing::error!(error = %e, "syslog TCP connection task panicked during shutdown");
                }
            }
        }
    };
    if tokio::time::timeout(SHUTDOWN_DRAIN_TIMEOUT, drain)
        .await
        .is_err()
    {
        tracing::warn!("syslog TCP shutdown drain timeout reached; aborting remaining tasks");
        conn_tasks.shutdown().await;
    }
}

#[allow(clippy::too_many_arguments)]
async fn handle_tcp_connection(
    stream: TcpStream,
    peer: SocketAddr,
    config: Arc<Config>,
    pool: Pool,
    metrics: Arc<SyslogMetrics>,
    prune_notify: Arc<Notify>,
    mut shutdown_rx: watch::Receiver<bool>,
    _guard: ConnectionGuard,
) {
    let max_frame_bytes = config.max_tcp_frame_bytes.max(1);
    let read_timeout = config.tcp_read_timeout();
    let mut reader = BoundedLineReader::new(stream, max_frame_bytes);
    let source_ip = Some(peer.ip().to_string());

    loop {
        let frame_res = tokio::select! {
            biased;
            _ = wait_for_shutdown(&mut shutdown_rx) => break,
            res = tokio::time::timeout(read_timeout, reader.next_frame()) => res,
        };

        let frame = match frame_res {
            Ok(Ok(Some(bytes))) => bytes,
            Ok(Ok(None)) => break,
            Ok(Err(FrameReadError::TooLarge)) => {
                metrics.record_tcp_oversized_frame();
                tracing::warn!(
                    %peer,
                    max_frame_bytes,
                    "rejecting oversized syslog TCP frame"
                );
                break;
            }
            Ok(Err(FrameReadError::Io(e))) => {
                metrics.record_tcp_read_error();
                tracing::debug!(error = %e, %peer, "syslog TCP read error");
                break;
            }
            Err(_) => {
                metrics.record_tcp_timeout();
                tracing::debug!(
                    %peer,
                    timeout_secs = read_timeout.as_secs(),
                    "closing idle or stalled syslog TCP connection"
                );
                break;
            }
        };

        let raw = match std::str::from_utf8(&frame) {
            Ok(s) => s,
            Err(_) => {
                metrics.record_tcp_invalid_utf8();
                tracing::warn!(%peer, "rejecting syslog TCP frame with invalid UTF-8");
                break;
            }
        };

        if let Err(e) = ingest(
            &pool,
            &config,
            &metrics,
            &prune_notify,
            "tcp",
            source_ip.clone(),
            raw,
        )
        .await
        {
            tracing::warn!(error = %e, %peer, "failed to ingest syslog TCP message");
        }
    }
}

/// Bounded per-source active TCP connection tracker.
///
/// Entries are removed on `ConnectionGuard::drop`, bounding map cardinality by
/// the global connection semaphore (`max_tcp_connections`).
#[derive(Clone)]
struct SourceConnectionTracker {
    counts: Arc<Mutex<HashMap<IpAddr, usize>>>,
    max_per_ip: usize,
}

impl SourceConnectionTracker {
    fn new(max_per_ip: usize) -> Self {
        Self {
            counts: Arc::new(Mutex::new(HashMap::new())),
            max_per_ip: max_per_ip.max(1),
        }
    }

    fn try_acquire(
        &self,
        ip: IpAddr,
        permit: OwnedSemaphorePermit,
        metrics: Arc<SyslogMetrics>,
    ) -> Option<ConnectionGuard> {
        let mut guard = self.counts.lock().unwrap_or_else(|e| e.into_inner());
        let entry = guard.entry(ip).or_insert(0);
        if *entry >= self.max_per_ip {
            return None;
        }
        *entry += 1;
        drop(guard);

        metrics.record_tcp_connection_accepted();
        Some(ConnectionGuard {
            ip,
            counts: self.counts.clone(),
            _permit: permit,
            metrics,
        })
    }

    #[cfg(test)]
    fn active_for(&self, ip: IpAddr) -> usize {
        let guard = self.counts.lock().unwrap_or_else(|e| e.into_inner());
        guard.get(&ip).copied().unwrap_or(0)
    }

    #[cfg(test)]
    fn tracked_ips(&self) -> usize {
        let guard = self.counts.lock().unwrap_or_else(|e| e.into_inner());
        guard.len()
    }
}

struct ConnectionGuard {
    ip: IpAddr,
    counts: Arc<Mutex<HashMap<IpAddr, usize>>>,
    _permit: OwnedSemaphorePermit,
    metrics: Arc<SyslogMetrics>,
}

impl Drop for ConnectionGuard {
    fn drop(&mut self) {
        let mut guard = self.counts.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(count) = guard.get_mut(&self.ip) {
            if *count <= 1 {
                guard.remove(&self.ip);
            } else {
                *count -= 1;
            }
        }
        drop(guard);
        self.metrics.record_tcp_connection_closed();
    }
}

#[derive(Debug)]
enum FrameReadError {
    TooLarge,
    Io(std::io::Error),
}

/// Reads newline-delimited (`\n`) TCP syslog frames while strictly bounding memory
/// and rejecting frames exceeding `max_frame_bytes` (including `\n`) without truncating.
struct BoundedLineReader<R> {
    reader: R,
    buf: BytesMut,
    max_frame_bytes: usize,
}

impl<R: AsyncReadExt + Unpin> BoundedLineReader<R> {
    fn new(reader: R, max_frame_bytes: usize) -> Self {
        let max_frame_bytes = max_frame_bytes.max(1);
        Self {
            reader,
            buf: BytesMut::with_capacity(max_frame_bytes.min(8192)),
            max_frame_bytes,
        }
    }

    async fn next_frame(&mut self) -> Result<Option<BytesMut>, FrameReadError> {
        loop {
            let scan_len = self.buf.len().min(self.max_frame_bytes);
            if let Some(pos) = self.buf[..scan_len].iter().position(|&b| b == b'\n') {
                return Ok(Some(self.buf.split_to(pos + 1)));
            }
            if self.buf.len() > self.max_frame_bytes {
                self.buf.clear();
                return Err(FrameReadError::TooLarge);
            }

            let mut scratch = [0u8; 8192];
            let n = self
                .reader
                .read(&mut scratch)
                .await
                .map_err(FrameReadError::Io)?;
            if n == 0 {
                if self.buf.is_empty() {
                    return Ok(None);
                }
                return Ok(Some(self.buf.split()));
            }

            let chunk = &scratch[..n];
            if let Some(nl) = chunk.iter().position(|&b| b == b'\n') {
                let frame_len = self.buf.len() + nl + 1;
                if frame_len > self.max_frame_bytes {
                    self.buf.clear();
                    return Err(FrameReadError::TooLarge);
                }
                let frame = if self.buf.is_empty() {
                    BytesMut::from(&chunk[..=nl])
                } else {
                    let mut out = self.buf.split();
                    out.extend_from_slice(&chunk[..=nl]);
                    out
                };
                let rest = &chunk[nl + 1..];
                if !rest.is_empty() {
                    self.buf.extend_from_slice(rest);
                }
                return Ok(Some(frame));
            }

            if self.buf.len() + n > self.max_frame_bytes {
                self.buf.clear();
                return Err(FrameReadError::TooLarge);
            }
            self.buf.extend_from_slice(chunk);
        }
    }
}

async fn ingest(
    pool: &Pool,
    config: &Config,
    metrics: &SyslogMetrics,
    prune_notify: &Notify,
    transport: &str,
    source_ip: Option<String>,
    raw: &str,
) -> anyhow::Result<()> {
    let started = Instant::now();
    let parsed = parser::parse(raw);
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    let res = sqlx::query(
        "INSERT INTO syslog_messages \
         (id, received_at, source_ip, transport, facility, severity, priority, timestamp, hostname, app_name, procid, msgid, message, raw) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(now)
    .bind(&source_ip)
    .bind(transport)
    .bind(parsed.facility.map(i64::from))
    .bind(parsed.severity.map(i64::from))
    .bind(parsed.priority.map(i64::from))
    .bind(&parsed.timestamp)
    .bind(&parsed.hostname)
    .bind(&parsed.app_name)
    .bind(&parsed.procid)
    .bind(&parsed.msgid)
    .bind(&parsed.message)
    .bind(raw.trim_end_matches(['\r', '\n']))
    .execute(pool)
    .await;

    match res {
        Ok(_) => {
            let pending = metrics.record_ingest_success(transport, started.elapsed());
            if config.max_messages > 0 && pending >= config.retention_prune_threshold.max(1) as u64
            {
                prune_notify.notify_one();
            }
            Ok(())
        }
        Err(e) => {
            metrics.record_ingest_error();
            Err(e.into())
        }
    }
}

async fn run_retention_pruner(
    config: Arc<Config>,
    pool: Pool,
    metrics: Arc<SyslogMetrics>,
    prune_notify: Arc<Notify>,
    mut shutdown_rx: watch::Receiver<bool>,
) {
    if config.max_messages <= 0 {
        wait_for_shutdown(&mut shutdown_rx).await;
        return;
    }

    let mut interval = tokio::time::interval(config.retention_prune_interval());
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    // Consume the immediate first tick so pruning runs only on threshold or after one interval.
    interval.tick().await;

    loop {
        tokio::select! {
            biased;
            _ = wait_for_shutdown(&mut shutdown_rx) => {
                if metrics.pending_retention() > 0 {
                    run_prune_pass(&pool, &config, &metrics, &prune_notify, false).await;
                }
                break;
            }
            _ = prune_notify.notified() => {
                run_prune_pass(&pool, &config, &metrics, &prune_notify, true).await;
            }
            _ = interval.tick() => {
                run_prune_pass(&pool, &config, &metrics, &prune_notify, true).await;
            }
        }
    }
}

async fn run_prune_pass(
    pool: &Pool,
    config: &Config,
    metrics: &SyslogMetrics,
    prune_notify: &Notify,
    requeue_if_remaining: bool,
) {
    let started = Instant::now();
    metrics.take_pending_retention();
    match prune_excess_bounded(
        pool,
        config.max_messages,
        config.retention_prune_batch_size.max(1),
        MAX_CHUNKS_PER_PRUNE_PASS,
    )
    .await
    {
        Ok((batches, deleted, has_more)) => {
            metrics.record_retention_run(batches, deleted, started.elapsed());
            if has_more && requeue_if_remaining {
                prune_notify.notify_one();
            }
        }
        Err(e) => {
            metrics.record_retention_error();
            tracing::warn!(error = %e, "syslog retention prune failed");
        }
    }
}

/// Deletes oldest rows beyond `max_messages` in bounded `batch_size` chunks
/// using SQLite's clustered `rowid` B-tree head scan (`O(batch_size)` per chunk).
pub async fn prune_excess_bounded(
    pool: &Pool,
    max_messages: i64,
    batch_size: i64,
    max_chunks: usize,
) -> anyhow::Result<(u64, u64, bool)> {
    if max_messages <= 0 {
        return Ok((0, 0, false));
    }

    let batch_size = batch_size.max(1);
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM syslog_messages")
        .fetch_one(pool)
        .await?;
    let mut remaining = total.saturating_sub(max_messages);
    if remaining <= 0 {
        return Ok((0, 0, false));
    }

    let mut batches = 0u64;
    let mut total_deleted = 0u64;

    for _ in 0..max_chunks {
        if remaining <= 0 {
            break;
        }
        let chunk = remaining.min(batch_size);
        let res = sqlx::query(
            "DELETE FROM syslog_messages WHERE rowid IN (\
               SELECT rowid FROM syslog_messages ORDER BY rowid ASC LIMIT ?\
             )",
        )
        .bind(chunk)
        .execute(pool)
        .await?;
        let deleted = res.rows_affected() as i64;
        if deleted == 0 {
            remaining = 0;
            break;
        }
        batches += 1;
        total_deleted += deleted as u64;
        remaining = remaining.saturating_sub(deleted);
        if remaining > 0 {
            tokio::task::yield_now().await;
        }
    }

    Ok((batches, total_deleted, remaining > 0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::Ipv4Addr;
    use tokio::io::AsyncWriteExt;

    #[tokio::test]
    async fn bounded_line_reader_handles_boundaries_and_pipelining() {
        let (mut writer, reader) = tokio::io::duplex(4096);
        let mut lr = BoundedLineReader::new(reader, 10);

        writer.write_all(b"123456789\n").await.unwrap();
        let f1 = lr.next_frame().await.unwrap().unwrap();
        assert_eq!(&f1[..], b"123456789\n");

        writer.write_all(b"ab\ncde\n").await.unwrap();
        let f2 = lr.next_frame().await.unwrap().unwrap();
        let f3 = lr.next_frame().await.unwrap().unwrap();
        assert_eq!(&f2[..], b"ab\n");
        assert_eq!(&f3[..], b"cde\n");

        writer.write_all(b"01234567890\n").await.unwrap();
        assert!(matches!(
            lr.next_frame().await,
            Err(FrameReadError::TooLarge)
        ));
    }

    #[tokio::test]
    async fn bounded_line_reader_accepts_exact_limit_eof_and_rejects_overflow_without_newline() {
        let (mut writer, reader) = tokio::io::duplex(4096);
        let mut lr = BoundedLineReader::new(reader, 10);

        writer.write_all(b"0123456789").await.unwrap();
        writer.shutdown().await.unwrap();
        let f = lr.next_frame().await.unwrap().unwrap();
        assert_eq!(&f[..], b"0123456789");
        assert!(lr.next_frame().await.unwrap().is_none());

        let (mut writer2, reader2) = tokio::io::duplex(4096);
        let mut lr2 = BoundedLineReader::new(reader2, 10);
        writer2.write_all(b"0123456789").await.unwrap();
        writer2.write_all(b"x").await.unwrap();
        assert!(matches!(
            lr2.next_frame().await,
            Err(FrameReadError::TooLarge)
        ));
    }

    #[tokio::test]
    async fn source_connection_tracker_enforces_per_ip_limit_and_cleans_up_on_drop() {
        let sem = Arc::new(Semaphore::new(4));
        let tracker = SourceConnectionTracker::new(2);
        let metrics = Arc::new(SyslogMetrics::new());
        let ip1 = IpAddr::V4(Ipv4Addr::new(10, 0, 0, 1));
        let ip2 = IpAddr::V4(Ipv4Addr::new(10, 0, 0, 2));

        let g1 = tracker
            .try_acquire(
                ip1,
                sem.clone().try_acquire_owned().unwrap(),
                metrics.clone(),
            )
            .unwrap();
        let g2 = tracker
            .try_acquire(
                ip1,
                sem.clone().try_acquire_owned().unwrap(),
                metrics.clone(),
            )
            .unwrap();
        assert_eq!(tracker.active_for(ip1), 2);
        assert_eq!(metrics.snapshot().tcp_connections_active, 2);

        // 3rd from ip1 is rejected even though global semaphore has 2 permits left.
        let p3 = sem.clone().try_acquire_owned().unwrap();
        assert!(tracker.try_acquire(ip1, p3, metrics.clone()).is_none());

        // Different source ip2 still succeeds.
        let g3 = tracker
            .try_acquire(
                ip2,
                sem.clone().try_acquire_owned().unwrap(),
                metrics.clone(),
            )
            .unwrap();
        assert_eq!(tracker.tracked_ips(), 2);

        drop(g1);
        drop(g2);
        assert_eq!(tracker.active_for(ip1), 0);
        assert_eq!(tracker.tracked_ips(), 1);
        assert_eq!(metrics.snapshot().tcp_connections_active, 1);

        drop(g3);
        assert_eq!(tracker.tracked_ips(), 0);
        assert_eq!(metrics.snapshot().tcp_connections_active, 0);
    }
}
