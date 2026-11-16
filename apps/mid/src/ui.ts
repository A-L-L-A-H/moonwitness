import { escapeHtml } from "./http";
import type { AuditEventRecord, OidcClient, PublicUser } from "./types";

const BASE_CSS = `
:root{--paper:#f5f2eb;--ink:#141312;--muted:#5c5852;--acid:#ffe500;--signal:#ff2e93;--card:#fffdf7;--line:#141312}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.45}
.wrap{max-width:880px;margin:0 auto;padding:32px 20px}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid var(--ink);padding-bottom:14px;margin-bottom:24px;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:18px}
.tag{background:var(--acid);border:2px solid var(--ink);padding:2px 8px;font-size:12px;font-weight:800}
.card{background:var(--card);border:3px solid var(--ink);box-shadow:6px 6px 0 var(--ink);padding:22px;margin-bottom:20px}
h1,h2{margin:0 0 10px;font-weight:900;letter-spacing:-.02em}
p.sub{margin:0 0 16px;color:var(--muted);font-size:14px}
label{display:block;font-weight:700;font-size:13px;margin:10px 0 4px}
input,select{width:100%;padding:10px 12px;border:2px solid var(--ink);background:#fff;font-size:14px;font-family:inherit}
button{cursor:pointer;border:2px solid var(--ink);background:var(--acid);color:var(--ink);font-weight:800;padding:10px 16px;font-size:14px;box-shadow:3px 3px 0 var(--ink);margin-top:12px}
button.sec{background:#fff}button.warn{background:var(--signal);color:#fff}
.err{background:#ffe1ee;border:2px solid var(--signal);padding:10px 12px;font-weight:700;margin-bottom:14px}
.ok{background:#e7ffd9;border:2px solid #1d6b18;padding:10px 12px;font-weight:700;margin-bottom:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:8px;border-bottom:1px solid #d7d2c7;vertical-align:top;word-break:break-word}
code{background:#eee9dd;padding:2px 5px;font-size:12px}
`.trim();

function renderLayout(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${BASE_CSS}</style></head><body><main class="wrap"><header class="hdr"><div class="brand"><span>MoonWitness ID</span><span class="tag">OIDC · PKCE · ES256</span></div><nav><a href="/.well-known/openid-configuration">Discovery</a> · <a href="/.well-known/jwks.json">JWKS</a></nav></header>${body}</main></body></html>`;
}

/** Render sovereign Sign-In & Identity Portal page. */
export function renderPortalPage(params: {
  issuer: string;
  user: PublicUser | null;
  clients: OidcClient[];
  audits: AuditEventRecord[];
  notice?: string;
  error?: string;
}): string {
  const banner = params.error
    ? `<div class="err" role="alert">${escapeHtml(params.error)}</div>`
    : params.notice
      ? `<div class="ok">${escapeHtml(params.notice)}</div>`
      : "";

  if (!params.user) {
    return renderLayout(
      "MoonWitness ID — Sign In",
      `${banner}<section class="card"><h1>Centralized Identity Authority</h1><p class="sub">Sign in once for unified SSO across MoonWitness Console, ALLAH Sanctuary, IGate, and CLI clients.</p><form method="post" action="/portal/login"><label for="identifier">Username or Email</label><input id="identifier" name="identifier" autocomplete="username" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Sign In to MoonWitness ID</button></form></section><section class="card"><h2>Endpoints</h2><p class="sub">Issuer: <code>${escapeHtml(params.issuer)}</code></p></section>`,
    );
  }

  const clientRows = params.clients
    .map(
      (entry) =>
        `<tr><td><strong>${escapeHtml(entry.name)}</strong><br><code>${escapeHtml(entry.clientId)}</code></td><td>${escapeHtml(entry.clientType)}</td><td>${entry.redirectUris.map((uri) => `<code>${escapeHtml(uri)}</code>`).join("<br>")}</td><td>${
          entry.firstParty
            ? "First-party"
            : `<form method="post" action="/portal/clients/delete"><input type="hidden" name="client_id" value="${escapeHtml(entry.clientId)}"><button class="warn" type="submit">Delete</button></form>`
        }</td></tr>`,
    )
    .join("");

  const adminSections =
    params.user.role === "admin"
      ? `<section class="card"><h2>Registered OIDC Clients</h2><table><thead><tr><th>Client</th><th>Type</th><th>Redirect URIs</th><th>Action</th></tr></thead><tbody>${clientRows}</tbody></table><h3>Register New OIDC Client</h3><form method="post" action="/portal/clients"><div class="grid"><div><label for="cid">Client ID</label><input id="cid" name="client_id" pattern="[a-z0-9-]{3,48}" required></div><div><label for="cname">Display Name</label><input id="cname" name="name" required></div><div><label for="ctype">Client Type</label><select id="ctype" name="client_type"><option value="public">public (PKCE)</option><option value="confidential">confidential (secret)</option></select></div></div><label for="curis">Redirect URIs (comma-separated)</label><input id="curis" name="redirect_uris" placeholder="https://app.moonwitness.biz.id/auth/callback" required><button type="submit">Register Client</button></form></section><section class="card"><h2>Recent Security Audit</h2><table><thead><tr><th>Time</th><th>Event</th><th>Client</th><th>IP</th></tr></thead><tbody>${params.audits
          .slice(0, 12)
          .map(
            (audit) =>
              `<tr><td><code>${escapeHtml(audit.createdAt)}</code></td><td>${escapeHtml(audit.eventType)}</td><td>${escapeHtml(audit.clientId ?? "-")}</td><td><code>${escapeHtml(audit.ipAddress)}</code></td></tr>`,
          )
          .join("")}</tbody></table></section>`
      : "";

  return renderLayout(
    "MoonWitness ID — Session",
    `${banner}<section class="card"><h1>Active SSO Session</h1><p class="sub">Signed in as <strong>${escapeHtml(params.user.displayName)}</strong> (<code>@${escapeHtml(params.user.username)}</code> · role: <code>${escapeHtml(params.user.role)}</code> · ${escapeHtml(params.user.email)})</p><form method="post" action="/oauth/logout"><button class="sec" type="submit">Sign Out Everywhere</button></form></section><section class="card"><h2>Rotate Account Password</h2><form method="post" action="/portal/password"><div class="grid"><div><label for="curpw">Current Password</label><input id="curpw" name="current_password" type="password" required></div><div><label for="newpw">New Password (min 10 chars)</label><input id="newpw" name="new_password" type="password" minlength="10" required></div></div><button type="submit">Update Password</button></form></section>${adminSections}`,
  );
}

/** Render OAuth 2.1 /authorize login & consent screen. */
export function renderAuthorizePage(params: {
  client: OidcClient;
  user: PublicUser | null;
  redirectUri: string;
  scope: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  error?: string;
}): string {
  const hiddenInputs = [
    ["client_id", params.client.clientId],
    ["redirect_uri", params.redirectUri],
    ["scope", params.scope],
    ["state", params.state],
    ["nonce", params.nonce],
    ["code_challenge", params.codeChallenge],
    ["code_challenge_method", params.codeChallengeMethod],
    ["response_type", "code"],
  ]
    .map(
      ([name, val]) =>
        `<input type="hidden" name="${name ?? ""}" value="${escapeHtml(val ?? "")}">`,
    )
    .join("");

  const banner = params.error
    ? `<div class="err" role="alert">${escapeHtml(params.error)}</div>`
    : "";
  const scopes = params.scope
    .split(/\s+/)
    .filter(Boolean)
    .map((entry) => `<code>${escapeHtml(entry)}</code>`)
    .join(" ");

  if (!params.user) {
    return renderLayout(
      `Sign In — ${params.client.name}`,
      `${banner}<section class="card"><h1>Sign in to ${escapeHtml(params.client.name)}</h1><p class="sub">Callback: <code>${escapeHtml(params.redirectUri)}</code> · Scopes: ${scopes}</p><form method="post" action="/authorize">${hiddenInputs}<input type="hidden" name="decision" value="approve"><label for="identifier">Username or Email</label><input id="identifier" name="identifier" autocomplete="username" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Sign In & Authorize</button></form></section>`,
    );
  }

  return renderLayout(
    `Authorize ${params.client.name}`,
    `${banner}<section class="card"><h1>Authorize ${escapeHtml(params.client.name)}</h1><p class="sub">Signed in as <strong>${escapeHtml(params.user.displayName)}</strong> (<code>@${escapeHtml(params.user.username)}</code>)</p><p class="sub">Callback: <code>${escapeHtml(params.redirectUri)}</code> · Requested scopes: ${scopes}</p><form method="post" action="/authorize">${hiddenInputs}<button type="submit" name="decision" value="approve">Approve & Continue</button> <button class="sec" type="submit" name="decision" value="deny">Deny</button></form></section>`,
  );
}
