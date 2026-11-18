FROM rust:1-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/storage /usr/local/bin/storage
RUN mkdir -p /data
ENV HOST=0.0.0.0
ENV HTTP_PORT=8091
ENV STORAGE_ROOT=/data
ENV DATABASE_URL=sqlite:/data/storage.db?mode=rwc
EXPOSE 8091
CMD ["storage"]
