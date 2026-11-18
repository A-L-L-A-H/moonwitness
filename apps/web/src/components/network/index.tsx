"use client";

import { useState } from "react";
import { CableCoilArt, Tape, ZineBadge, ZineCard, ZineCardRough, ZineInput } from "@moonwitness/ui";
import { Crown, VpnTunnel } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { ControlGate } from "@/components/control/gate";
import { PortForwardPanel } from "./portforward";
import {
  useCreatePeer,
  useDeletePeer,
  usePeerConfig,
  useSetPeerQuota,
  useVPNDown,
  useVPNStatus,
  useVPNUp,
  type VPNPeer,
} from "@/lib/api/vpn";

function formatTraffic(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

function handshakeLabel(epoch?: string): { text: string; live: boolean } {
  if (!epoch) return { text: "belum pernah", live: false };
  const seconds = Number(epoch);
  if (!Number.isFinite(seconds) || seconds <= 0) return { text: "belum pernah", live: false };
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  if (diff < 180) return { text: `${diff}s lalu`, live: true };
  if (diff < 7200) return { text: `${Math.floor(diff / 60)}m lalu`, live: true };
  if (diff < 172800) return { text: `${Math.floor(diff / 3600)}j lalu`, live: false };
  return { text: `${Math.floor(diff / 86400)}h lalu`, live: false };
}

function ConfigPanel({
  name,
  config,
  onClose,
}: {
  name: string;
  config: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([config], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.conf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ZineCardRough className="relative p-5">
      <Tape className="-top-3 left-8 -rotate-3" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-brush text-xl text-[var(--foreground)]">
          <VpnTunnel className="h-5 w-5 text-[var(--primary)]" />
          <span>
            CONFIG <span className="text-[var(--green)]">{name.toUpperCase()}</span>
          </span>
        </h3>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="btn-zine btn-blue px-3 py-2 text-[11px]">
            {copied ? "TERSALIN" : "SALIN"}
          </button>
          <button
            type="button"
            onClick={download}
            className="btn-zine btn-yellow px-3 py-2 text-[11px]"
          >
            UNDUH .CONF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-zine btn-paper px-3 py-2 text-[11px]"
          >
            TUTUP
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[var(--primary)]">
        Private key hanya ditampilkan sekarang. Salin sebelum menutup panel ini.
      </p>
      <pre className="mt-3 max-h-80 overflow-auto border border-[var(--border)] bg-[var(--muted)] p-3 font-mono text-[11px] leading-relaxed text-[var(--foreground)]">
        {config}
      </pre>
    </ZineCardRough>
  );
}

function PeerRow({
  peer,
  onShowConfig,
  onDelete,
  onSetQuota,
  busy,
}: {
  peer: VPNPeer;
  onShowConfig: () => void;
  onDelete: () => void;
  onSetQuota: () => void;
  busy: boolean;
}) {
  const hs = handshakeLabel(peer.handshake);
  const total = (peer.rx_bytes || 0) + (peer.tx_bytes || 0);
  const quota = peer.quota_bytes ?? 0;
  const pct = quota > 0 ? Math.min(100, Math.round((total / quota) * 100)) : 0;
  return (
    <tr className="border-b border-[var(--border)]/60 last:border-b-0">
      <td className="px-3 py-2">
        <span className="font-mono text-xs text-[var(--foreground)]">{peer.name}</span>
        <span className="ml-2 text-[10px] tracking-widest text-[var(--muted-foreground)]">
          {peer.mode.toUpperCase()}
        </span>
        {peer.subnet && (
          <span className="ml-2 text-[10px] tracking-widest text-[var(--cyan,var(--blue))]">
            {peer.subnet}
          </span>
        )}
        {peer.quota_blocked && (
          <span className="ml-2 border border-[var(--red)]/50 bg-[var(--red)]/10 px-1.5 py-0.5 text-[9px] tracking-widest text-[var(--red)]">
            KUOTA HABIS
          </span>
        )}
        {peer.extra_cidrs && peer.extra_cidrs.length > 0 && (
          <p className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
            {peer.extra_cidrs.join(", ")}
          </p>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-[var(--muted-foreground)]">
        {peer.address}
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-block border px-2 py-0.5 text-[10px] tracking-widest ${
            hs.live
              ? "border-[var(--green)]/50 bg-[var(--green)]/10 text-[var(--green)]"
              : "border-[var(--border)] text-[var(--muted-foreground)]"
          }`}
        >
          {hs.text.toUpperCase()}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-[10px] text-[var(--muted-foreground)]">
        <div>
          ↓{formatTraffic(peer.rx_bytes)} ↑{formatTraffic(peer.tx_bytes)}
        </div>
        {quota > 0 && (
          <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
            {formatTraffic(total)} / {formatTraffic(quota)} ({pct}%)
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={onSetQuota}
          disabled={busy}
          className="btn-zine btn-paper mr-2 px-2.5 py-1.5 text-[10px]"
        >
          KUOTA
        </button>
        <button
          type="button"
          onClick={onShowConfig}
          className="btn-zine btn-paper mr-2 px-2.5 py-1.5 text-[10px]"
        >
          CONFIG
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="btn-zine px-2.5 py-1.5 text-[10px]"
        >
          HAPUS
        </button>
      </td>
    </tr>
  );
}

export function NetworkCenter() {
  return (
    <ControlGate>
      <NetworkDashboard />
    </ControlGate>
  );
}

function NetworkDashboard() {
  const [query, setQuery] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [localCIDR, setLocalCIDR] = useState("");
  const [peerName, setPeerName] = useState("");
  const [peerMode, setPeerMode] = useState<"split" | "full" | "site">("split");
  const [peerCIDR, setPeerCIDR] = useState("");
  const [peerSubnet, setPeerSubnet] = useState("");
  const [config, setConfig] = useState<{ name: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = useVPNStatus();
  const up = useVPNUp();
  const down = useVPNDown();
  const create = useCreatePeer();
  const remove = useDeletePeer();
  const fetchConfig = usePeerConfig();
  const setQuota = useSetPeerQuota();

  function runEndpointUp() {
    setError(null);
    const cidrs = localCIDR
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    up.mutate(
      { endpoint: endpoint.trim() || undefined, local_cidrs: cidrs },
      { onError: (err: Error) => setError(err.message) },
    );
  }

  function addPeer() {
    setError(null);
    if (!peerName.trim()) {
      setError("Nama peer wajib diisi.");
      return;
    }
    const cidrs = peerCIDR
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (peerMode === "site" && cidrs.length === 0) {
      setError("Mode SITE butuh CIDR LAN, mis. 192.168.10.0/24");
      return;
    }
    create.mutate(
      {
        name: peerName.trim(),
        mode: peerMode,
        extra_cidrs: cidrs,
        subnet: peerSubnet.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setConfig({ name: data.peer.name, text: data.config });
          setPeerName("");
          setPeerCIDR("");
        },
        onError: (err: Error) => setError(err.message),
      },
    );
  }

  function showConfig(name: string) {
    setError(null);
    fetchConfig.mutate(name, {
      onSuccess: (data) => setConfig({ name: data.peer.name, text: data.config }),
      onError: (err: Error) => setError(err.message),
    });
  }

  function deletePeer(name: string) {
    setError(null);
    remove.mutate(name, { onError: (err: Error) => setError(err.message) });
  }

  function editQuota(name: string) {
    setError(null);
    const raw = window.prompt(
      `Kuota total (rx+tx) untuk ${name} dalam byte. 0 = tanpa batas.`,
      "0",
    );
    if (raw === null) return;
    const quota = Number(raw.trim());
    if (!Number.isFinite(quota) || quota < 0) {
      setError("Kuota harus angka byte >= 0.");
      return;
    }
    setQuota.mutate(
      { name, quota_bytes: Math.floor(quota) },
      { onError: (err: Error) => setError(err.message) },
    );
  }

  const data = status.data;

  return (
    <ConsoleShellAdapter
      plane="operations"
      breadcrumb="Network"
      search={{ value: query, onChange: setQuery, placeholder: "Filter peer…" }}
    >
      <div className="space-y-6 px-4 py-6 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-brush text-3xl text-[var(--foreground)] sm:text-4xl">
              VPN <span className="text-[var(--primary)]">TUNNEL</span>
            </h1>
            <p className="mt-1 max-w-xl font-hand text-xl text-[var(--muted-foreground)]">
              WireGuard di host ini. Tambah perangkat, unduh config, langsung tersambung.
            </p>
          </div>
          <ZineBadge color={data?.enabled ? "var(--mint)" : "var(--pink)"} dark>
            {status.isLoading ? "MEMERIKSA" : data?.enabled ? "AKTIF" : "MATI"}
          </ZineBadge>
        </header>

        {status.isError && (
          <ZineCardRough className="p-6">
            <h2 className="font-brush text-2xl text-[var(--red)]">ARSY TIDAK TERJANGKAU</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {(status.error as Error).message}
            </p>
          </ZineCardRough>
        )}

        {data && !data.available && (
          <ZineCardRough className="p-5">
            <h2 className="font-brush text-xl text-[var(--primary)]">TOOL BELUM ADA</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Host ini belum punya <code>{data.missing_tools?.join(", ")}</code>. Pasang dengan{" "}
              <code>apt install wireguard-tools iproute2 nftables</code> lalu muat ulang halaman.
            </p>
          </ZineCardRough>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ZineCard className="p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
                  INTERFACE
                </p>
                <p className="mt-1 font-brush text-2xl text-[var(--foreground)]">
                  {data.interface}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">
                  {data.address}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">
                  udp/{data.listen_port}
                </p>
                {data.subnets && data.subnets.length > 0 && (
                  <p className="mt-1 font-mono text-[10px] text-[var(--muted-foreground)]">
                    subnets: {data.subnets.map((s) => `${s.name}(${s.cidr})`).join(", ")}
                  </p>
                )}
              </ZineCard>
              <ZineCard className="p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
                  ENDPOINT
                </p>
                <p className="mt-1 truncate font-mono text-sm text-[var(--foreground)]">
                  {data.endpoint || "—"}
                </p>
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  Alamat yang dipakai PC untuk menyambung.
                </p>
              </ZineCard>
              <ZineCard className="p-4">
                <p className="text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
                  PUBLIC KEY
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-[var(--foreground)]">
                  {data.public_key || "belum dibuat"}
                </p>
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  {data.peer_count} peer terdaftar
                </p>
              </ZineCard>
            </div>

            {!data.enabled && (
              <ZineCard className="p-5">
                <h2 className="font-brush text-xl text-[var(--foreground)]">
                  AKTIFKAN <span className="text-[var(--primary)]">TUNNEL</span>
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Isi domain/IP publik VPS agar config PC bisa dibuat. Port default 51820/udp.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <ZineInput
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="vps.contoh.id:51820"
                    className="rounded-md px-4 py-2.5 text-sm"
                    aria-label="Endpoint publik"
                  />
                  <ZineInput
                    value={localCIDR}
                    onChange={(e) => setLocalCIDR(e.target.value)}
                    placeholder="LAN server (opsional) 10.20.0.0/24"
                    className="rounded-md px-4 py-2.5 text-sm"
                    aria-label="CIDR LAN server"
                  />
                  <button
                    type="button"
                    onClick={runEndpointUp}
                    disabled={up.isPending}
                    className="btn-zine shrink-0 px-5 py-2.5 text-sm"
                  >
                    {up.isPending ? "MENYALAKAN…" : "AKTIFKAN"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  Port <code>udp/{data.listen_port}</code> dibuka otomatis di firewall host
                  {data.manage_firewall ? "" : " (manajemen firewall dimatikan)"}.
                </p>
              </ZineCard>
            )}

            {data.enabled && (
              <>
                <ZineCard className="p-5">
                  <h2 className="font-brush text-xl text-[var(--foreground)]">
                    TAMBAH <span className="text-[var(--primary)]">PERANGKAT</span>
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                    <ZineInput
                      value={peerName}
                      onChange={(e) => setPeerName(e.target.value)}
                      placeholder="pc-rumah"
                      className="rounded-md px-4 py-2.5 text-sm"
                      aria-label="Nama perangkat"
                    />
                    <ZineInput
                      value={peerSubnet}
                      onChange={(e) => setPeerSubnet(e.target.value)}
                      placeholder="subnet (default)"
                      list="vpn-subnets"
                      className="rounded-md px-4 py-2.5 text-sm"
                      aria-label="Subnet peer"
                    />
                    <datalist id="vpn-subnets">
                      {(data.subnets ?? []).map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.cidr}
                        </option>
                      ))}
                    </datalist>
                    <div className="flex gap-1">
                      {(["split", "full", "site"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPeerMode(mode)}
                          aria-pressed={peerMode === mode}
                          className={`border px-3 py-2 text-[10px] tracking-widest ${
                            peerMode === mode
                              ? "border-[var(--pink)] bg-[var(--pink)]/15 text-[var(--primary)]"
                              : "border-[var(--border)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addPeer}
                      disabled={create.isPending}
                      className="btn-zine px-5 py-2.5 text-sm"
                    >
                      {create.isPending ? "MEMBUAT…" : "TAMBAH"}
                    </button>
                  </div>
                  {peerMode === "site" && (
                    <div className="mt-2">
                      <ZineInput
                        value={peerCIDR}
                        onChange={(e) => setPeerCIDR(e.target.value)}
                        placeholder="LAN di balik router, mis. 192.168.10.0/24"
                        className="rounded-md px-4 py-2.5 text-sm"
                        aria-label="CIDR LAN peer site"
                      />
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                    <strong className="text-[var(--foreground)]">SPLIT</strong> hanya subnet VPN —
                    internet tetap lewat ISP.{" "}
                    <strong className="text-[var(--foreground)]">FULL</strong> semua trafik lewat
                    VPS. <strong className="text-[var(--foreground)]">SITE</strong> untuk router
                    kantor: LAN di balik router ikut terhubung.
                  </p>
                </ZineCard>

                <ZineCard className="overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b-2 border-[var(--border)] px-4 py-3">
                    <h2 className="inline-flex items-center gap-2 font-brush text-lg text-[var(--foreground)]">
                      <VpnTunnel className="h-4 w-4 text-[var(--primary)]" />
                      <span>
                        PERANGKAT <span className="text-[var(--primary)]">TERDAFTAR</span>
                      </span>
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        down.mutate(undefined, { onError: (e: Error) => setError(e.message) })
                      }
                      disabled={down.isPending}
                      className="btn-zine btn-paper px-3 py-2 text-[10px]"
                    >
                      MATIKAN TUNNEL
                    </button>
                  </div>
                  {data.peers.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                      <CableCoilArt className="h-16 w-16 opacity-85" decorative />
                      <p>Belum ada perangkat. Tambahkan PC Anda di atas.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-left text-[9px] tracking-[0.2em] text-[var(--muted-foreground)]">
                            <th className="px-3 py-2 font-normal">NAMA</th>
                            <th className="px-3 py-2 font-normal">ALAMAT</th>
                            <th className="px-3 py-2 font-normal">HANDSHAKE</th>
                            <th className="px-3 py-2 font-normal">TRAFIK / KUOTA</th>
                            <th className="px-3 py-2 font-normal" />
                          </tr>
                        </thead>
                        <tbody>
                          {data.peers.map((peer) => (
                            <PeerRow
                              key={peer.id}
                              peer={peer}
                              busy={remove.isPending || setQuota.isPending}
                              onShowConfig={() => showConfig(peer.name)}
                              onSetQuota={() => editQuota(peer.name)}
                              onDelete={() => deletePeer(peer.name)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </ZineCard>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="border border-[var(--red)]/40 bg-[var(--red)]/10 px-3 py-2 text-xs text-[var(--red)]"
              >
                {error}
              </p>
            )}

            {config && (
              <ConfigPanel
                name={config.name}
                config={config.text}
                onClose={() => setConfig(null)}
              />
            )}

            <PortForwardPanel />

            <ZineCardRough className="p-5">
              <h2 className="font-brush text-lg text-[var(--foreground)]">
                CARA <span className="text-[var(--primary)]">SAMBUNG</span>
              </h2>
              <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                <li>
                  1. Unduh file <code>.conf</code> di atas.
                </li>
                <li>2. Pasang aplikasi WireGuard resmi di PC (Windows/macOS/Linux/Android/iOS).</li>
                <li>3. Impor file tersebut, lalu aktifkan tunnel.</li>
                <li>
                  4. Cek dari PC: <code>ping {data.address.split("/")[0]}</code> — balasan berarti
                  tunnel hidup.
                </li>
                <li>
                  5. Pastikan port <code>udp/{data.listen_port}</code> terbuka di firewall VPS.
                </li>
              </ol>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] tracking-wider text-[var(--muted-foreground)]">
                <Crown className="h-3 w-5 text-[var(--primary)]" />
                PRIVATE KEY TIDAK PERNAH DISIMPAN DI BROWSER
              </p>
            </ZineCardRough>
          </>
        )}
      </div>
    </ConsoleShellAdapter>
  );
}
