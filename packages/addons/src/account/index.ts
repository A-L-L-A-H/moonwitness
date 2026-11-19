import { createHash } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel, SYSTEM_ACTOR, type ActorContext } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const accountManifest = manifestData as AddonManifestInput;

export const ledgerLineInputSchema = z.object({
  account_code: z.string().min(1).max(40),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  description: z.string().max(255).default(""),
});

export type LedgerLineInput = z.infer<typeof ledgerLineInputSchema>;

export function toScaledUnits(amount: number, scale = 2): bigint {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative finite number.");
  }
  return BigInt(Math.round(amount * 10 ** scale));
}

export function validateBalancedLines(lines: LedgerLineInput[]): {
  totalDebit: number;
  totalCredit: number;
} {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("Journal entry requires at least 2 lines.");
  }
  let debitUnits = 0n;
  let creditUnits = 0n;
  for (const line of lines) {
    const d = toScaledUnits(line.debit);
    const c = toScaledUnits(line.credit);
    if ((d > 0n && c > 0n) || (d === 0n && c === 0n)) {
      throw new Error(
        `Line on account '${line.account_code}' must have strictly positive debit OR credit.`,
      );
    }
    debitUnits += d;
    creditUnits += c;
  }
  if (debitUnits <= 0n || debitUnits !== creditUnits) {
    throw new Error("Double-entry invariant violated: total debit must equal total credit.");
  }
  return {
    totalDebit: Number(debitUnits) / 100,
    totalCredit: Number(creditUnits) / 100,
  };
}

export const accountAccountSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  account_type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  currency_code: z.string().min(3).max(8).default("IDR"),
  reconcile: z.boolean().default(false),
});

export const accountAccountModel = defineModel({
  name: "account.account",
  table: "acc_accounts",
  schema: accountAccountSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["code", "name", "account_type"],
  publicFields: ["code", "name", "account_type", "currency_code", "reconcile"],
  indexes: [{ fields: ["tenant_id", "code"], unique: true }, { fields: ["account_type"] }],
});

export const accountJournalSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(160),
  journal_type: z.enum(["sale", "purchase", "cash", "bank", "general"]).default("general"),
  currency_code: z.string().min(3).max(8).default("IDR"),
});

export const accountJournalModel = defineModel({
  name: "account.journal",
  table: "acc_journals",
  schema: accountJournalSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name", "journal_type"],
  publicFields: ["code", "name", "journal_type", "currency_code"],
  indexes: [{ fields: ["tenant_id", "code"], unique: true }],
});

export const accountMoveSchema = z.object({
  move_key: z.string().min(1).max(120),
  journal_code: z.string().min(1).max(20).default("GEN"),
  move_date: z.string().min(8).max(32),
  currency_code: z.string().min(3).max(8).default("IDR"),
  move_state: z.enum(["draft", "posted", "reversed"]).default("draft"),
  idempotency_key: z.string().max(128).nullable().default(null),
  fingerprint: z.string().max(128).nullable().default(null),
  reversal_of_key: z.string().max(120).nullable().default(null),
  total_debit: z.number().nonnegative().default(0),
  total_credit: z.number().nonnegative().default(0),
  lines_json: z.string().default("[]"),
});

export const postEntryInputSchema = z.object({
  move_key: z.string().min(1).max(120),
  journal_code: z.string().min(1).max(20).default("GEN"),
  move_date: z
    .string()
    .min(8)
    .max(32)
    .default(() => new Date().toISOString().slice(0, 10)),
  currency_code: z.string().min(3).max(8).default("IDR"),
  idempotency_key: z.string().min(1).max(128),
  lines: z.array(ledgerLineInputSchema).min(2),
});

export const accountMoveModel = defineModel({
  name: "account.move",
  table: "acc_moves",
  schema: accountMoveSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["move_key", "journal_code", "idempotency_key"],
  publicFields: [
    "move_key",
    "journal_code",
    "move_date",
    "currency_code",
    "move_state",
    "total_debit",
    "total_credit",
  ],
  constrains: [
    ({ after }) => {
      if (after.move_state === "posted") {
        const lines = JSON.parse(String(after.lines_json ?? "[]")) as LedgerLineInput[];
        validateBalancedLines(lines);
      }
    },
  ],
  actions: {
    post_entry: {
      scope: "model",
      roles: ["editor", "admin"],
      label: "Post Balanced Journal Entry",
      input: postEntryInputSchema,
      handler: async ({ input, actor }): Promise<unknown> =>
        postBalancedMove(input as z.infer<typeof postEntryInputSchema>, actor),
    },
    reverse_entry: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Reverse Posted Entry",
      input: z.object({ reversal_key: z.string().min(1).max(120) }).optional(),
      handler: async ({ record, input, actor }): Promise<unknown> =>
        reversePostedMove(
          String(record!.move_key),
          (input as { reversal_key?: string } | undefined)?.reversal_key ??
            `${String(record!.move_key)}-REV`,
          actor,
        ),
    },
  },
  indexes: [
    { fields: ["tenant_id", "move_key"], unique: true },
    { fields: ["move_state"] },
    { fields: ["idempotency_key"] },
  ],
});

export async function postBalancedMove(
  input: z.infer<typeof postEntryInputSchema>,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<unknown> {
  const { totalDebit, totalCredit } = validateBalancedLines(input.lines);
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        journal_code: input.journal_code,
        move_date: input.move_date,
        currency_code: input.currency_code,
        lines: input.lines,
      }),
    )
    .digest("hex");

  const tenantId = actor.tenantId ?? "default";
  const existing = (
    await accountMoveModel.repository.find(
      { idempotency_key: input.idempotency_key },
      { tenantId, limit: 1 },
    )
  )[0];
  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      throw new Error("Idempotency key reused with a different ledger payload.");
    }
    return existing;
  }

  return accountMoveModel.repository.create(
    {
      move_key: input.move_key,
      journal_code: input.journal_code,
      move_date: input.move_date,
      currency_code: input.currency_code,
      move_state: "posted",
      idempotency_key: input.idempotency_key,
      fingerprint,
      reversal_of_key: null,
      total_debit: totalDebit,
      total_credit: totalCredit,
      lines_json: JSON.stringify(input.lines),
    },
    actor,
  );
}

export async function reversePostedMove(
  originalMoveKey: string,
  reversalKey: string,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<unknown> {
  const tenantId = actor.tenantId ?? "default";
  const original = (
    await accountMoveModel.repository.find({ move_key: originalMoveKey }, { tenantId, limit: 1 })
  )[0];
  if (!original || original.move_state !== "posted") {
    throw new Error(`Posted move '${originalMoveKey}' not found.`);
  }
  const origLines = JSON.parse(original.lines_json) as LedgerLineInput[];
  const reversedLines = origLines.map((line) => ({
    account_code: line.account_code,
    debit: line.credit,
    credit: line.debit,
    description: `Reversal: ${line.description}`,
  }));
  const reversal = await accountMoveModel.repository.create(
    {
      move_key: reversalKey,
      journal_code: original.journal_code,
      move_date: original.move_date,
      currency_code: original.currency_code,
      move_state: "posted",
      idempotency_key: `rev:${original.move_key}:${reversalKey}`,
      fingerprint: createHash("sha256").update(reversalKey).digest("hex"),
      reversal_of_key: original.move_key,
      total_debit: original.total_credit,
      total_credit: original.total_debit,
      lines_json: JSON.stringify(reversedLines),
    },
    actor,
  );
  await accountMoveModel.repository.update(original.id, { move_state: "reversed" }, actor);
  return reversal;
}

export const accountData: AddonDataRecord[] = [
  {
    id: "acc_1010_cash",
    model: "account.account",
    key: { code: "1010" },
    noupdate: true,
    values: {
      code: "1010",
      name: "Cash & Bank",
      account_type: "asset",
      currency_code: "IDR",
      reconcile: true,
    },
  },
  {
    id: "acc_1200_ar",
    model: "account.account",
    key: { code: "1200" },
    noupdate: true,
    values: {
      code: "1200",
      name: "Accounts Receivable",
      account_type: "asset",
      currency_code: "IDR",
      reconcile: true,
    },
  },
  {
    id: "acc_2000_ap",
    model: "account.account",
    key: { code: "2000" },
    noupdate: true,
    values: {
      code: "2000",
      name: "Accounts Payable",
      account_type: "liability",
      currency_code: "IDR",
      reconcile: true,
    },
  },
  {
    id: "acc_4000_revenue",
    model: "account.account",
    key: { code: "4000" },
    noupdate: true,
    values: {
      code: "4000",
      name: "Operating Revenue",
      account_type: "income",
      currency_code: "IDR",
      reconcile: false,
    },
  },
  {
    id: "acc_5000_expense",
    model: "account.account",
    key: { code: "5000" },
    noupdate: true,
    values: {
      code: "5000",
      name: "Operating Expense",
      account_type: "expense",
      currency_code: "IDR",
      reconcile: false,
    },
  },
  {
    id: "jnl_gen",
    model: "account.journal",
    key: { code: "GEN" },
    noupdate: true,
    values: { code: "GEN", name: "General Journal", journal_type: "general", currency_code: "IDR" },
  },
  {
    id: "jnl_bnk",
    model: "account.journal",
    key: { code: "BNK" },
    noupdate: true,
    values: { code: "BNK", name: "Bank Journal", journal_type: "bank", currency_code: "IDR" },
  },
];

export const accountRules: IrRuleInput[] = [
  { model_name: "account.account", role: "viewer", can_read: true },
  {
    model_name: "account.account",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "account.account",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "account.journal", role: "viewer", can_read: true },
  {
    model_name: "account.journal",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "account.move", role: "viewer", can_read: true },
  {
    model_name: "account.move",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "account.move",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const accountViews: IrViewInput[] = [
  {
    model_name: "account.move",
    view_type: "list",
    spec: {
      title: "Journal Entries (ExactLedger)",
      description: "Double-entry balanced journal moves with SHA-256 idempotency.",
      domainIcon: "arsy",
      columns: [
        "move_key",
        "journal_code",
        "move_date",
        "total_debit",
        "total_credit",
        "move_state",
      ],
    },
  },
];

export const accountMenus: IrMenuInput[] = [
  {
    menu_key: "account.moves",
    label: "Accounting Ledger",
    href: "/models/account.move",
    icon: "arsy",
    plane: "operations",
    sort_order: 76,
    min_role: "viewer",
  },
];

export function createAccountAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: accountManifest,
    models: [accountAccountModel, accountJournalModel, accountMoveModel],
    rules: accountRules,
    views: accountViews,
    menus: accountMenus,
    data: accountData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/account/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [accounts, journals, moves, byState] = await Promise.all([
          accountAccountModel.repository.count({}, { tenantId }),
          accountJournalModel.repository.count({}, { tenantId }),
          accountMoveModel.repository.count({}, { tenantId }),
          accountMoveModel.repository.readGroup({ groupBy: ["move_state"], tenantId }),
        ]);
        return { accounts, journals, moves, byState };
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/account/ledger/post`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = postEntryInputSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid ledger entry payload" });
          }
          try {
            const actor = resolveActorContextFromBridge(auth, request);
            const move = await postBalancedMove(parsed.data, actor);
            return reply.code(201).send({ move });
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return reply.code(400).send({ error: msg });
          }
        },
      );

      scope.post<{ Body: { move_key?: string; reversal_key?: string } }>(
        `${prefix}/account/ledger/reverse`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const body = request.body ?? {};
          if (!body.move_key || !body.reversal_key) {
            return reply.code(400).send({ error: "move_key and reversal_key are required" });
          }
          try {
            const actor = resolveActorContextFromBridge(auth, request);
            const move = await reversePostedMove(body.move_key, body.reversal_key, actor);
            return reply.code(201).send({ move });
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return reply.code(400).send({ error: msg });
          }
        },
      );
    },
  };
}

export const accountAddon = createAccountAddon();
