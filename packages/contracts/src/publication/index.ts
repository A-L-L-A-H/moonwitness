import { z } from "zod";

/** Owner approval record for selective export (MW-0410). */
export const PublicationApprovalSchema = z
  .object({
    approvedBy: z.string().min(1),
    approvedAt: z.string().datetime(),
    scope: z.enum(["single", "bundle", "collection"]),
    notes: z.string().optional(),
  })
  .strict();
export type PublicationApproval = z.infer<typeof PublicationApprovalSchema>;

/** Selective owner-approved export item (MW-0410). */
export const PublicationExportItemSchema = z
  .object({
    domain: z.enum(["canon", "knowledge", "witness", "chronicle", "research"]),
    recordId: z.string().min(1),
    redactedFields: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type PublicationExportItem = z.infer<typeof PublicationExportItemSchema>;

/** Selective owner-approved export contract (MW-0410). */
export const PublicationExportSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(["pending_approval", "approved", "published", "retracted"]),
    items: z.array(PublicationExportItemSchema).min(1),
    approval: PublicationApprovalSchema.optional(),
    publishedAt: z.string().datetime().optional(),
  })
  .strict();
export type PublicationExport = z.infer<typeof PublicationExportSchema>;

/** Correction or retraction notice for a published export (MW-0410). */
export const PublicationCorrectionSchema = z
  .object({
    id: z.string().min(1),
    exportId: z.string().min(1),
    action: z.enum(["correction", "retraction"]),
    reason: z.string().min(1),
    issuedBy: z.string().min(1),
    issuedAt: z.string().datetime(),
    replacementExportId: z.string().min(1).optional(),
  })
  .strict();
export type PublicationCorrection = z.infer<typeof PublicationCorrectionSchema>;
