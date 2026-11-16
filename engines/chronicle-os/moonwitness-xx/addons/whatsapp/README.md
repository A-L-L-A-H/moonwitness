# WhatsApp Baileys add-on

This add-on is optional and disabled by default. The MoonWitness core must start, migrate, and serve its primary API without Baileys installed.

## Adapter boundary

The add-on implements the platform messaging provider port:
- Start, stop, and inspect an explicitly authorized session.
- Request QR/pairing flow and expose only short-lived pairing presentation data.
- Send one approved message through the worker pipeline.
- Receive inbound events and map them to normalized integration events.
- Report connection state and health.

## Production requirements

- Do not use Baileys file-based auth state as production credential storage.
- Persist credentials and Signal keys using a dedicated encrypted adapter; persist key updates before acknowledging writes.
- Encrypt session material at rest with a managed key.
- Never return credentials, identity keys, or raw session blobs to the browser.
- Enforce one active socket owner per session using a distributed lease.
- Use idempotency keys for outbound jobs and bounded retries.
- Require explicit account-connection consent and authorization for each messaging purpose.
- No unsolicited bulk messaging, scraping, stalking, or evasion of platform controls.
- Provide disconnect/revoke and delete-session operations.
- Keep inbound retention configurable and minimal.
- Never log QR payloads, auth blobs, encryption keys, or message bodies.

Baileys is a community library, not an official WhatsApp product. Pin and review its release channel before production enablement. Keep the adapter isolated so an official WhatsApp Business Platform provider can later implement the same port.

See [WhatsApp adapter architecture](../../docs/architecture/WHATSAPP_ADAPTER.md).
