# MoonWitness Single-VPS Topology & Operations Guide

## Overview

MoonWitness runs as a consolidated single-VPS topology managed via Docker Compose V2 and fronted exclusively by Caddy reverse proxy.

```mermaid
flowchart TD
    Internet([Public Internet]) -->|TCP 80, 443 / UDP 443| Caddy[Caddy Reverse Proxy]
    NAS([Authorized NAS / VPN]) -->|UDP 1812, 1813| Radius[RADIUS Service]
    VPNSyslog([VPN / Local Ingest]) -->|UDP 5140, TCP 5514| Syslog[Syslog Service]

    subgraph moonwitness-public [moonwitness-public Bridge Network]
        Caddy -->|moonwitness.biz.id| Web[apps/web :3000]
        Caddy -->|a-l-l-a-h.com| Allah[apps/a-l-l-a-h :3003]
        Caddy -->|api / id.moonwitness.biz.id| Api[apps/api :3002]
    end

    subgraph moonwitness-internal [moonwitness-internal Bridge Network (internal: true)]
        Api -->|http://radius:8090| Radius
        Api -->|http://snmp-poller:8094| Snmp[SNMP Poller :8094]
        Api -->|http://syslog:8093| Syslog
    end

    subgraph Persistent Storage
        Api --- VolApi[(moonwitness-data)]
        Radius --- VolRadius[(radius-data)]
        Snmp --- VolSnmp[(snmp-data)]
        Syslog --- VolSyslog[(syslog-data)]
        Caddy --- VolCaddyData[(caddy_data)]
        Caddy --- VolCaddyCfg[(caddy_config)]
    end
```

## Security & Network Boundaries

1. **Ingress Protection**: Caddy is the only service that publishes public web ports (80/443 TCP, 443 UDP). Direct external access to application web ports (`3000`, `3002`, `3003`) and internal HTTP management ports (`8090`, `8093`, `8094`) is blocked by network architecture.
2. **Data-Plane Isolation**: The `moonwitness-internal` bridge network has `internal: true`, preventing internal services from receiving inbound or making outbound direct internet connections unless routed through approved internal pathways.
3. **Protected Ingestion**:
   - **Syslog**: Bound to `127.0.0.1` (or operator VPN IP) by default (`SYSLOG_BIND_IP`). Never expose unauthenticated plaintext syslog directly to the public internet.
   - **RADIUS**: UDP 1812/1813 exposed for inventoried NAS peers, paired with host firewall allow-lists and shared secrets.

## Minimum & Recommended VPS Resources

| Component  | Minimum                       | Recommended                   |
| ---------- | ----------------------------- | ----------------------------- |
| **CPU**    | 2 vCPU                        | 4 vCPU                        |
| **Memory** | 4 GB RAM                      | 8 GB RAM                      |
| **Disk**   | 40 GB NVMe SSD                | 80+ GB NVMe SSD               |
| **OS**     | Ubuntu 24.04 LTS / Debian 12  | Ubuntu 24.04 LTS / Debian 12  |
| **Docker** | Docker Engine 26+, Compose V2 | Docker Engine 27+, Compose V2 |

## Operations & Lifecycle Management

### 1. Initial Configuration

```bash
# Clone repository onto VPS
git clone https://github.com/A-L-L-A-H/moonwitness.git /opt/moonwitness
cd /opt/moonwitness

# Create production environment configuration
cp .env.example .env
chmod 600 .env

# Edit .env and supply secure production secrets
nano .env
```

### 2. Deployment

```bash
# Build images and start all services in detached mode
docker compose up -d --build --remove-orphans

# Verify health status of all containers
docker compose ps

# Inspect logs
docker compose logs -f --tail=100
```

### 3. Graceful Restart / Update

```bash
# Pull latest repository state
git pull origin dev

# Rebuild and replace containers with zero downtime on unmodified services
docker compose up -d --build --remove-orphans
```

### 4. Rollback Procedure

```bash
# Revert git commit to target stable SHA
git checkout <PREVIOUS_STABLE_SHA>

# Rebuild and redeploy previous container versions
docker compose up -d --build --remove-orphans

# Verify service health
docker compose ps
```

### 5. Safe Teardown

```bash
# Stop containers without removing persistent data volumes
docker compose down

# CAUTION: Never pass -v / --volumes unless performing a deliberate total purge
```
