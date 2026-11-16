import { Type } from "@sinclair/typebox";

export const SuccessEnvelopeSchema = Type.Object({
  data: Type.Unknown(),
  meta: Type.Optional(Type.Record(Type.String(), Type.Unknown()))
}, { additionalProperties: false });

export const ErrorEnvelopeSchema = Type.Object({
  error: Type.Object({
    code: Type.String({ minLength: 1, maxLength: 120 }),
    message: Type.String({ minLength: 1, maxLength: 2000 }),
    details: Type.Optional(Type.Unknown())
  }, { additionalProperties: false }),
  requestId: Type.String({ minLength: 1, maxLength: 120 })
}, { additionalProperties: false });

export function successEnvelope(data, meta = {}) {
  return { data, meta };
}

export function errorEnvelope(code, message, requestId, details) {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    },
    requestId: requestId || "unknown"
  };
}
