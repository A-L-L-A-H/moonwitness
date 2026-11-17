FROM rust:1-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/snmp-poller /usr/local/bin/snmp-poller
RUN mkdir -p /data
ENV HOST=0.0.0.0
ENV HTTP_PORT=8094
ENV DATABASE_URL=sqlite:/data/snmp.db?mode=rwc
EXPOSE 8094
CMD ["snmp-poller"]
