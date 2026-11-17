export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Render the Neo-Brutalist IGate NOC Edge Console HTML document. */
export function renderIgateConsoleHtml(params: {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly isCallbackRoute: boolean;
}): string {
  const escapedIssuer = escapeHtml(params.issuerUrl);
  const escapedClient = escapeHtml(params.clientId);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MoonWitness IGate // Sovereign Edge NOC</title>
  <style>
    :root { --bg: #0a0a0c; --card: #f8f7f2; --ink: #111116; --yellow: #ffe600; --muted: #555562; --green: #10b981; --red: #e60023; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 28px 16px; }
    main { max-width: 920px; margin: 0 auto; }
    .panel { background: var(--card); border: 3px solid var(--ink); box-shadow: 7px 7px 0 var(--yellow); padding: 24px; margin-bottom: 20px; }
    .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
    h1 { margin: 8px 0 6px; font-size: 24px; letter-spacing: 0.04em; text-transform: uppercase; }
    .tag { display: inline-block; background: var(--ink); color: var(--yellow); padding: 3px 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; }
    button { border: 2px solid var(--ink); background: var(--yellow); color: var(--ink); font-family: inherit; font-weight: 800; font-size: 12px; padding: 10px 14px; cursor: pointer; text-transform: uppercase; box-shadow: 3px 3px 0 var(--ink); }
    button.sec { background: #fff; }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    .status { font-size: 13px; color: var(--muted); margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
    th, td { border: 2px solid var(--ink); padding: 8px 10px; text-align: left; }
    th { background: #eceae0; text-transform: uppercase; font-size: 11px; }
    .ok { color: #047857; font-weight: 800; }
    .fail { color: var(--red); font-weight: 800; }
    .err { border: 2px solid var(--ink); background: #ffe5ea; color: #8c0018; padding: 10px; margin-top: 12px; font-size: 12px; font-weight: 700; display: none; }
    .hidden { display: none; }
  </style>
</head>
<body data-issuer="${escapedIssuer}" data-client-id="${escapedClient}" data-callback="${params.isCallbackRoute ? "true" : "false"}">
  <main>
    <section class="panel">
      <div class="row">
        <div>
          <span class="tag">MOONWITNESS IGATE // EDGE NOC</span>
          <h1>${params.isCallbackRoute ? "Completing OIDC PKCE Exchange…" : "Sovereign Gateway Control"}</h1>
          <p class="status" id="igate-actor">Issuer: <code>${escapedIssuer}</code> · Public health endpoints active; sign in to inspect &amp; probe live nodes.</p>
        </div>
        <div class="row">
          <button type="button" id="btn-login">Sign In via MoonWitness ID</button>
          <button type="button" id="btn-probe" class="sec hidden">Run Live Edge Probes</button>
          <button type="button" id="btn-logout" class="sec hidden">Sign Out</button>
        </div>
      </div>
      <div id="igate-error" class="err" role="alert"></div>
    </section>

    <section class="panel hidden" id="panel-nodes">
      <span class="tag">REGISTERED TARGETS &amp; D1 AUDIT</span>
      <table>
        <thead>
          <tr><th>Node</th><th>Target URL</th><th>Category</th><th>Last Status</th><th>Latency</th></tr>
        </thead>
        <tbody id="nodes-body"></tbody>
      </table>
    </section>
  </main>
  <script src="/assets/igate.js" type="module"></script>
</body>
</html>`;
}

/** Render strict-CSP `/assets/igate.js` client script executing PKCE login and authenticated NOC calls. */
export function renderIgateClientScript(): string {
  return `const PKCE_KEY = "mw_igate_pkce";
const TOKEN_KEY = "mw_igate_access_token";
const body = document.body;
const issuer = (body.dataset.issuer || "https://id.moonwitness.biz.id").replace(/\\/+$/, "");
const clientId = body.dataset.clientId || "igate-console";
const isCallback = body.dataset.callback === "true";

const btnLogin = document.getElementById("btn-login");
const btnProbe = document.getElementById("btn-probe");
const btnLogout = document.getElementById("btn-logout");
const actorEl = document.getElementById("igate-actor");
const errEl = document.getElementById("igate-error");
const panelNodes = document.getElementById("panel-nodes");
const nodesBody = document.getElementById("nodes-body");

function showError(msg) {
  errEl.textContent = msg;
  errEl.style.display = "block";
}

function clearError() {
  errEl.textContent = "";
  errEl.style.display = "none";
}

function toBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function randomToken(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function sha256B64Url(input) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toBase64Url(new Uint8Array(digest));
}

async function startLogin() {
  clearError();
  const verifier = randomToken(48);
  const state = randomToken(20);
  const nonce = randomToken(20);
  const challenge = await sha256B64Url(verifier);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));

  const url = new URL(issuer + "/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", window.location.origin + "/auth/callback");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  window.location.assign(url.toString());
}

async function completeCallbackIfNeeded() {
  if (!isCallback) return false;
  const params = new URLSearchParams(window.location.search);
  const err = params.get("error");
  if (err) {
    showError(params.get("error_description") || err);
    return true;
  }
  const code = params.get("code");
  const state = params.get("state");
  const raw = sessionStorage.getItem(PKCE_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  if (!code || !state || !raw) {
    showError("Missing OAuth callback parameters or expired PKCE session.");
    return true;
  }
  const stored = JSON.parse(raw);
  if (stored.state !== state) {
    showError("OAuth state mismatch.");
    return true;
  }
  const res = await fetch(issuer + "/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: window.location.origin + "/auth/callback",
      code_verifier: stored.verifier,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    showError(data?.error_description || data?.error || "Token exchange failed.");
    return true;
  }
  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  window.location.replace("/");
  return true;
}

function renderRows(nodes, events) {
  const latestByNode = new Map();
  for (const ev of events || []) {
    if (!latestByNode.has(ev.nodeId)) latestByNode.set(ev.nodeId, ev);
  }
  nodesBody.innerHTML = "";
  for (const node of nodes || []) {
    const ev = latestByNode.get(node.id);
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.textContent = node.name;
    const tdUrl = document.createElement("td");
    tdUrl.textContent = node.targetUrl;
    const tdCat = document.createElement("td");
    tdCat.textContent = node.category;
    const tdStatus = document.createElement("td");
    tdStatus.className = ev ? (ev.ok ? "ok" : "fail") : "";
    tdStatus.textContent = ev ? String(ev.statusCode) + (ev.ok ? " OK" : " ERR") : "NOT PROBED";
    const tdLatency = document.createElement("td");
    tdLatency.textContent = ev ? String(ev.latencyMs) + " ms" : "—";
    tr.append(tdName, tdUrl, tdCat, tdStatus, tdLatency);
    nodesBody.append(tr);
  }
}

async function loadStatus() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    btnLogin.classList.remove("hidden");
    btnProbe.classList.add("hidden");
    btnLogout.classList.add("hidden");
    panelNodes.classList.add("hidden");
    return;
  }
  const res = await fetch("/api/status", { headers: { authorization: "Bearer " + token } });
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    return loadStatus();
  }
  const payload = await res.json();
  actorEl.textContent = "Signed in as @" + payload.actor.username + " (" + payload.actor.role + ") · Live D1 telemetry";
  btnLogin.classList.add("hidden");
  btnProbe.classList.remove("hidden");
  btnLogout.classList.remove("hidden");
  panelNodes.classList.remove("hidden");
  renderRows(payload.nodes, payload.recentEvents);
}

async function triggerProbe() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return;
  clearError();
  btnProbe.disabled = true;
  try {
    const res = await fetch("/api/probe", {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: "{}",
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      showError(payload?.error_description || payload?.error || "Probe execution denied.");
    } else {
      await loadStatus();
    }
  } finally {
    btnProbe.disabled = false;
  }
}

btnLogin.addEventListener("click", () => { void startLogin(); });
btnProbe.addEventListener("click", () => { void triggerProbe(); });
btnLogout.addEventListener("click", () => {
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.reload();
});

const handledCallback = await completeCallbackIfNeeded();
if (!handledCallback) {
  await loadStatus();
}
`;
}
