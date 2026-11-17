FROM rust:1-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/syslog /usr/local/bin/syslog
RUN mkdir -p /data
ENV HOST=0.0.0.0
ENV HTTP_PORT=8093
ENV SYSLOG_UDP_PORT=5140
ENV SYSLOG_TCP_PORT=5514
ENV DATABASE_URL=sqlite:/data/syslog.db?mode=rwc
EXPOSE 8093 5140/udp 5514
CMD ["syslog"]
