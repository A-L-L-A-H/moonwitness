import { Type } from "@sinclair/typebox";

export const HealthResponseSchema = Type.Object({
  status: Type.String(),
  service: Type.String(),
  timestamp: Type.String({ format: "date-time" })
}, { additionalProperties: false });
