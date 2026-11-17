FROM rust:1.85-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/radius /usr/local/bin/radius
RUN mkdir -p /data
ENV HOST=0.0.0.0
ENV HTTP_PORT=8090
ENV RADIUS_AUTH_PORT=1812
ENV RADIUS_ACCT_PORT=1813
ENV DATABASE_URL=sqlite:/data/radius.db?mode=rwc
EXPOSE 8090 1812/udp 1813/udp
CMD ["radius"]
