use std::fmt::Write;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use serde::Serialize;

/// Lock-free runtime counters and timing metrics for the syslog service.
#[derive(Debug, Default)]
pub struct SyslogMetrics {
    pub messages_ingested_total: AtomicU64,
    pub udp_messages_ingested_total: AtomicU64,
    pub tcp_messages_ingested_total: AtomicU64,
    pub ingest_errors_total: AtomicU64,
    pub ingest_duration_micros_total: AtomicU64,
    pub ingest_duration_micros_max: AtomicU64,

    pub tcp_frames_rejected_oversized_total: AtomicU64,
    pub tcp_frames_rejected_invalid_utf8_total: AtomicU64,
    pub tcp_read_errors_total: AtomicU64,
    pub udp_recv_errors_total: AtomicU64,

    pub tcp_connections_accepted_total: AtomicU64,
    pub tcp_connections_active: AtomicU64,
    pub tcp_connections_rejected_limit_total: AtomicU64,
    pub tcp_connections_rejected_per_ip_total: AtomicU64,
    pub tcp_connections_timed_out_total: AtomicU64,

    pub retention_prune_runs_total: AtomicU64,
    pub retention_prune_batches_total: AtomicU64,
    pub retention_prune_rows_deleted_total: AtomicU64,
    pub retention_prune_errors_total: AtomicU64,
    pub retention_prune_duration_micros_total: AtomicU64,
    pub retention_pending_messages: AtomicU64,
}

/// Serializable point-in-time view of `SyslogMetrics`.
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct MetricsSnapshot {
    pub messages_ingested_total: u64,
    pub udp_messages_ingested_total: u64,
    pub tcp_messages_ingested_total: u64,
    pub ingest_errors_total: u64,
    pub ingest_duration_micros_total: u64,
    pub ingest_duration_micros_max: u64,
    pub ingest_latency_avg_micros: f64,

    pub tcp_frames_rejected_oversized_total: u64,
    pub tcp_frames_rejected_invalid_utf8_total: u64,
    pub tcp_read_errors_total: u64,
    pub udp_recv_errors_total: u64,

    pub tcp_connections_accepted_total: u64,
    pub tcp_connections_active: u64,
    pub tcp_connections_rejected_total: u64,
    pub tcp_connections_rejected_limit_total: u64,
    pub tcp_connections_rejected_per_ip_total: u64,
    pub tcp_connections_timed_out_total: u64,

    pub retention_prune_runs_total: u64,
    pub retention_prune_batches_total: u64,
    pub retention_prune_rows_deleted_total: u64,
    pub retention_prune_errors_total: u64,
    pub retention_prune_duration_micros_total: u64,
    pub retention_pending_messages: u64,
}

impl SyslogMetrics {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn record_ingest_success(&self, transport: &str, elapsed: Duration) -> u64 {
        let micros = elapsed.as_micros().min(u64::MAX as u128) as u64;
        self.messages_ingested_total.fetch_add(1, Ordering::Relaxed);
        match transport {
            "udp" => {
                self.udp_messages_ingested_total
                    .fetch_add(1, Ordering::Relaxed);
            }
            "tcp" => {
                self.tcp_messages_ingested_total
                    .fetch_add(1, Ordering::Relaxed);
            }
            _ => {}
        }
        self.ingest_duration_micros_total
            .fetch_add(micros, Ordering::Relaxed);
        self.ingest_duration_micros_max
            .fetch_max(micros, Ordering::Relaxed);
        self.retention_pending_messages
            .fetch_add(1, Ordering::AcqRel)
            + 1
    }

    pub fn record_ingest_error(&self) {
        self.ingest_errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_oversized_frame(&self) {
        self.tcp_frames_rejected_oversized_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_invalid_utf8(&self) {
        self.tcp_frames_rejected_invalid_utf8_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_read_error(&self) {
        self.tcp_read_errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_udp_recv_error(&self) {
        self.udp_recv_errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_connection_accepted(&self) {
        self.tcp_connections_accepted_total
            .fetch_add(1, Ordering::Relaxed);
        self.tcp_connections_active.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_connection_closed(&self) {
        self.tcp_connections_active.fetch_sub(1, Ordering::Relaxed);
    }

    pub fn record_tcp_rejected_limit(&self) {
        self.tcp_connections_rejected_limit_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_rejected_per_ip(&self) {
        self.tcp_connections_rejected_per_ip_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_tcp_timeout(&self) {
        self.tcp_connections_timed_out_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn take_pending_retention(&self) -> u64 {
        self.retention_pending_messages.swap(0, Ordering::AcqRel)
    }

    pub fn pending_retention(&self) -> u64 {
        self.retention_pending_messages.load(Ordering::Acquire)
    }

    pub fn record_retention_run(&self, batches: u64, rows_deleted: u64, elapsed: Duration) {
        let micros = elapsed.as_micros().min(u64::MAX as u128) as u64;
        self.retention_prune_runs_total
            .fetch_add(1, Ordering::Relaxed);
        if batches > 0 {
            self.retention_prune_batches_total
                .fetch_add(batches, Ordering::Relaxed);
        }
        if rows_deleted > 0 {
            self.retention_prune_rows_deleted_total
                .fetch_add(rows_deleted, Ordering::Relaxed);
        }
        self.retention_prune_duration_micros_total
            .fetch_add(micros, Ordering::Relaxed);
    }

    pub fn record_retention_error(&self) {
        self.retention_prune_errors_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn snapshot(&self) -> MetricsSnapshot {
        let ingested = self.messages_ingested_total.load(Ordering::Relaxed);
        let duration_total = self.ingest_duration_micros_total.load(Ordering::Relaxed);
        let rejected_limit = self
            .tcp_connections_rejected_limit_total
            .load(Ordering::Relaxed);
        let rejected_per_ip = self
            .tcp_connections_rejected_per_ip_total
            .load(Ordering::Relaxed);

        MetricsSnapshot {
            messages_ingested_total: ingested,
            udp_messages_ingested_total: self.udp_messages_ingested_total.load(Ordering::Relaxed),
            tcp_messages_ingested_total: self.tcp_messages_ingested_total.load(Ordering::Relaxed),
            ingest_errors_total: self.ingest_errors_total.load(Ordering::Relaxed),
            ingest_duration_micros_total: duration_total,
            ingest_duration_micros_max: self.ingest_duration_micros_max.load(Ordering::Relaxed),
            ingest_latency_avg_micros: if ingested > 0 {
                duration_total as f64 / ingested as f64
            } else {
                0.0
            },
            tcp_frames_rejected_oversized_total: self
                .tcp_frames_rejected_oversized_total
                .load(Ordering::Relaxed),
            tcp_frames_rejected_invalid_utf8_total: self
                .tcp_frames_rejected_invalid_utf8_total
                .load(Ordering::Relaxed),
            tcp_read_errors_total: self.tcp_read_errors_total.load(Ordering::Relaxed),
            udp_recv_errors_total: self.udp_recv_errors_total.load(Ordering::Relaxed),
            tcp_connections_accepted_total: self
                .tcp_connections_accepted_total
                .load(Ordering::Relaxed),
            tcp_connections_active: self.tcp_connections_active.load(Ordering::Relaxed),
            tcp_connections_rejected_total: rejected_limit + rejected_per_ip,
            tcp_connections_rejected_limit_total: rejected_limit,
            tcp_connections_rejected_per_ip_total: rejected_per_ip,
            tcp_connections_timed_out_total: self
                .tcp_connections_timed_out_total
                .load(Ordering::Relaxed),
            retention_prune_runs_total: self.retention_prune_runs_total.load(Ordering::Relaxed),
            retention_prune_batches_total: self
                .retention_prune_batches_total
                .load(Ordering::Relaxed),
            retention_prune_rows_deleted_total: self
                .retention_prune_rows_deleted_total
                .load(Ordering::Relaxed),
            retention_prune_errors_total: self.retention_prune_errors_total.load(Ordering::Relaxed),
            retention_prune_duration_micros_total: self
                .retention_prune_duration_micros_total
                .load(Ordering::Relaxed),
            retention_pending_messages: self.retention_pending_messages.load(Ordering::Relaxed),
        }
    }

    pub fn to_prometheus(&self) -> String {
        let snap = self.snapshot();
        let mut out = String::with_capacity(2048);

        let metrics: [(&str, &str, &str, u64); 22] = [
            (
                "syslog_messages_ingested_total",
                "counter",
                "Total syslog messages ingested into SQLite",
                snap.messages_ingested_total,
            ),
            (
                "syslog_udp_messages_ingested_total",
                "counter",
                "Total syslog messages ingested over UDP",
                snap.udp_messages_ingested_total,
            ),
            (
                "syslog_tcp_messages_ingested_total",
                "counter",
                "Total syslog messages ingested over TCP",
                snap.tcp_messages_ingested_total,
            ),
            (
                "syslog_ingest_errors_total",
                "counter",
                "Total syslog ingest failures",
                snap.ingest_errors_total,
            ),
            (
                "syslog_ingest_duration_micros_total",
                "counter",
                "Cumulative syslog ingest latency in microseconds",
                snap.ingest_duration_micros_total,
            ),
            (
                "syslog_ingest_duration_micros_max",
                "gauge",
                "Maximum observed single-message syslog ingest latency in microseconds",
                snap.ingest_duration_micros_max,
            ),
            (
                "syslog_tcp_frames_rejected_oversized_total",
                "counter",
                "Total TCP syslog frames rejected for exceeding max_tcp_frame_bytes",
                snap.tcp_frames_rejected_oversized_total,
            ),
            (
                "syslog_tcp_frames_rejected_invalid_utf8_total",
                "counter",
                "Total TCP syslog frames rejected for invalid UTF-8",
                snap.tcp_frames_rejected_invalid_utf8_total,
            ),
            (
                "syslog_tcp_read_errors_total",
                "counter",
                "Total unexpected TCP socket read errors",
                snap.tcp_read_errors_total,
            ),
            (
                "syslog_udp_recv_errors_total",
                "counter",
                "Total UDP socket receive errors",
                snap.udp_recv_errors_total,
            ),
            (
                "syslog_tcp_connections_accepted_total",
                "counter",
                "Total accepted TCP syslog connections",
                snap.tcp_connections_accepted_total,
            ),
            (
                "syslog_tcp_connections_active",
                "gauge",
                "Currently active TCP syslog connections",
                snap.tcp_connections_active,
            ),
            (
                "syslog_tcp_connections_rejected_total",
                "counter",
                "Total rejected TCP syslog connections across all limits",
                snap.tcp_connections_rejected_total,
            ),
            (
                "syslog_tcp_connections_rejected_limit_total",
                "counter",
                "Total TCP syslog connections rejected due to global max_tcp_connections limit",
                snap.tcp_connections_rejected_limit_total,
            ),
            (
                "syslog_tcp_connections_rejected_per_ip_total",
                "counter",
                "Total TCP syslog connections rejected due to per-IP connection limit",
                snap.tcp_connections_rejected_per_ip_total,
            ),
            (
                "syslog_tcp_connections_timed_out_total",
                "counter",
                "Total TCP syslog connections closed due to idle/frame read timeout",
                snap.tcp_connections_timed_out_total,
            ),
            (
                "syslog_retention_prune_runs_total",
                "counter",
                "Total retention prune sweeps executed",
                snap.retention_prune_runs_total,
            ),
            (
                "syslog_retention_prune_batches_total",
                "counter",
                "Total bounded DELETE batches executed by retention pruning",
                snap.retention_prune_batches_total,
            ),
            (
                "syslog_retention_prune_rows_deleted_total",
                "counter",
                "Total rows deleted by retention pruning",
                snap.retention_prune_rows_deleted_total,
            ),
            (
                "syslog_retention_prune_errors_total",
                "counter",
                "Total retention pruning errors",
                snap.retention_prune_errors_total,
            ),
            (
                "syslog_retention_prune_duration_micros_total",
                "counter",
                "Cumulative retention pruning duration in microseconds",
                snap.retention_prune_duration_micros_total,
            ),
            (
                "syslog_retention_pending_messages",
                "gauge",
                "Messages ingested since last retention prune check",
                snap.retention_pending_messages,
            ),
        ];

        for (name, kind, help, value) in metrics {
            let _ = writeln!(out, "# HELP {name} {help}");
            let _ = writeln!(out, "# TYPE {name} {kind}");
            let _ = writeln!(out, "{name} {value}");
        }

        out
    }
}
