# Webhooks

`@rocksoul/webhooks` is the sole authority for external webhook ingress, subscriptions, signing, durable delivery, retry, and delivery history. Application execution remains owned by AEP/Main API; the service accepts canonical `AppEvent` values over authenticated `POST /internal/events`.

Outbound endpoint subscriptions use exact, namespace (`whatsapp.*`), or global (`*`) patterns. A logical delivery is unique per `(eventId, endpointId)` and retries retain its `webhook-id`. Requests use Standard Webhooks headers and bounded redirects, response size, and timeouts. HTTPS and public networks are required by default.

Inbound Flow webhooks terminate at `/ingress/:provider/:bindingId`; they require the internal ingress credential in V1 and deduplicate `(provider, external event id, binding)` before handing off to Flow's private trigger endpoint. Raw provider-specific verification adapters are the extension point for external providers.

WhatsApp now publishes `whatsapp.message.received` AppEvents. Its old direct dispatcher, local `wa_webhooks` table, and management routes are retired. Production migrations must import legacy rows into webhook endpoints/subscriptions before deploying this removal; no production database was available during this change.
