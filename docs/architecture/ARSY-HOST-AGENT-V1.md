# Arsy Host Agent — V1 Capability Allowlist & Security Constraints

## V1 Scope

Arsy V1 is a minimal, auditable VPS host management agent. It operates exclusively over a loopback-only listener and enforces a strict plan/confirm flow for every write operation.

### Active Resource Kinds (V1)

| Kind            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `docker`        | Docker container lifecycle (run, stop, rm, pull)       |
| `dockercompose` | Docker Compose stack lifecycle (up, down)              |
| `systemd`       | Systemd unit management (start, stop, enable, disable) |
| `dir`           | Directory creation and permission management           |
| `file`          | File content management (atomic write)                 |
| `backup`        | File/directory backup to local destination             |
| `cert`          | TLS certificate management via certbot/openssl         |

### V1 Active Capabilities

- Host metrics observation (CPU, memory, disk)
- Docker and Docker Compose inventory
- Container health and log inspection
- Allow-listed container restart/stop/start operations
- Deployment read-info (git status, image digest)
- Audit trail for every write operation
- Plan/confirm flow: no write executes without an explicit confirmation step

---

## Deferred from V1

The following resource kinds are explicitly **not supported** in V1. Any plan referencing them will fail at validate time with a descriptive error.

| Kind          | Reason                                                                                     | Migration Path                                   |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `kubernetes`  | Tidak termasuk dalam scope v1 arsy; kompleksitas cluster management di luar boundary agent | Gunakan `kubectl` langsung atau Helm             |
| `gitdeploy`   | Digantikan oleh GitHub Actions deployment pipeline (MW-0038)                               | Gunakan `.github/workflows/deploy.yml`           |
| `cron`        | Tidak termasuk dalam scope v1; crontab sulit diaudit secara deterministik                  | Gunakan `systemd` timers (unit `.timer`)         |
| `user`        | Manajemen user tidak termasuk dalam scope v1; risiko privilege escalation                  | Provision user via cloud-init atau Ansible       |
| `firewall`    | Manajemen firewall tidak termasuk dalam scope v1; risiko lock-out                          | Gunakan `ufw`/`nft` manual atau IaC              |
| `portforward` | Port forwarding tidak termasuk dalam scope v1                                              | Gunakan reverse proxy (Caddy/nginx)              |
| `network`     | Manajemen jaringan tidak termasuk dalam scope v1                                           | Konfigurasi via netplan atau cloud provider      |
| `ssh`         | Manajemen SSH key tidak termasuk dalam scope v1; risiko lock-out                           | Provision key via cloud-init                     |
| `mount`       | Mount filesystem tidak termasuk dalam scope v1                                             | Konfigurasi via `/etc/fstab` atau cloud provider |
| `alert`       | Alert engine tidak termasuk dalam scope v1                                                 | Gunakan monitoring stack (Prometheus/Grafana)    |
| `webhook`     | Webhook outbound tidak termasuk dalam scope v1                                             | Gunakan GitHub Actions atau n8n                  |
| `package`     | Manajemen paket tidak termasuk dalam scope v1; non-deterministic di runtime                | Bake ke Docker image atau gunakan Packer         |

---

## Security Constraints

### Listener

- Arsy binds **loopback only** (`127.0.0.1`). No external exposure without an explicit tunnel.
- Separate read (`viewer`) and admin (`operator`) roles — read operations never require admin credentials.

### Audit Trail

- Every write operation (apply) is logged with: timestamp, operator identity, resource kind/name, action, diff fields.
- Audit log is append-only and stored outside the agent process working directory.

### Volume Safety

- `dockercompose` with `state: absent` runs `docker compose down --remove-orphans` **without** `--volumes`.
- Volume deletion is an explicit, separately guarded operation and must never happen automatically.

### Shell Injection Prevention

- `gitdeploy.post_cmd` is **rejected at validate time** in V1. Arbitrary shell strings are not executed.
- All runner invocations use structured `Command{Name, Args}` — never `sh -c <user_string>`.

### Plan/Confirm Flow

- No resource apply executes without passing through `Plan()` first and presenting diffs to the operator.
- Destructive actions (`ActionDelete`) require explicit acknowledgment.

---

## Migration Notes

### From `gitdeploy` to GitHub Actions

Replace any `gitdeploy` resource with a `.github/workflows/deploy.yml` that SSHes into the VPS and runs `git pull && docker compose up -d`. This gives full audit via GitHub's deployment log.

### From `cron` to `systemd` timers

Create a `.service` + `.timer` unit pair managed via the `systemd` resource kind. Timers are auditable, restartable, and observable via `systemctl status`.

### From `package` to Docker images

Move package installation into `Dockerfile` layers. Use the `dockercompose` resource kind to manage the resulting stack.

### From `kubernetes` to `dockercompose`

For single-VPS workloads, replace Kubernetes manifests with `docker-compose.yml` files managed by the `dockercompose` resource kind.
