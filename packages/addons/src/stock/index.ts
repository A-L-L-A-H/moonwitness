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

export const stockManifest = manifestData as AddonManifestInput;

export const productProductSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(180),
  category: z.string().max(80).default("general"),
  product_type: z.enum(["storable", "consumable", "service"]).default("storable"),
  list_price: z.number().nonnegative().default(0),
  cost_price: z.number().nonnegative().default(0),
  uom: z.string().max(24).default("Unit"),
});

export const productProductModel = defineModel({
  name: "product.product",
  table: "stk_products",
  schema: productProductSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["sku", "name", "category"],
  publicFields: ["sku", "name", "category", "product_type", "list_price", "uom"],
  indexes: [{ fields: ["tenant_id", "sku"], unique: true }, { fields: ["category"] }],
});

export const stockLocationSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(160),
  usage: z
    .enum(["internal", "supplier", "customer", "inventory", "transit"])
    .default("internal"),
});

export const stockLocationModel = defineModel({
  name: "stock.location",
  table: "stk_locations",
  schema: stockLocationSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name", "usage"],
  publicFields: ["code", "name", "usage"],
  indexes: [{ fields: ["tenant_id", "code"], unique: true }, { fields: ["usage"] }],
});

export const stockQuantSchema = z.object({
  product_sku: z.string().min(1).max(64),
  location_code: z.string().min(1).max(64),
  quantity: z.number().nonnegative().default(0),
  reserved_quantity: z.number().nonnegative().default(0),
});

export const stockQuantModel = defineModel({
  name: "stock.quant",
  table: "stk_quants",
  schema: stockQuantSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["product_sku", "location_code"],
  publicFields: ["product_sku", "location_code", "quantity", "reserved_quantity"],
  computed: {
    available_quantity: (row) => Number(row.quantity ?? 0) - Number(row.reserved_quantity ?? 0),
  },
  constrains: [
    ({ after }) => {
      const qty = Number(after.quantity ?? 0);
      const res = Number(after.reserved_quantity ?? 0);
      if (qty < 0 || res < 0 || res > qty) {
        throw new Error("Stock quant invariant violated: 0 <= reserved_quantity <= quantity.");
      }
    },
  ],
  indexes: [{ fields: ["tenant_id", "product_sku", "location_code"], unique: true }],
});

export const stockMoveSchema = z.object({
  reference: z.string().min(1).max(64),
  product_sku: z.string().min(1).max(64),
  location_src_code: z.string().min(1).max(64),
  location_dest_code: z.string().min(1).max(64),
  quantity: z.number().positive(),
  move_state: z.enum(["draft", "confirmed", "assigned", "done", "cancel"]).default("draft"),
});

export async function executeStockTransfer(
  reference: string,
  operation: "reserve" | "complete" | "cancel",
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<unknown> {
  const tenantId = actor.tenantId ?? "default";
  const move = (
    await stockMoveModel.repository.find({ reference }, { tenantId, limit: 1 })
  )[0];
  if (!move) throw new Error(`Stock move '${reference}' not found.`);

  const targetState =
    operation === "reserve" ? "assigned" : operation === "complete" ? "done" : "cancel";
  if (move.move_state === targetState) return move;

  if (operation === "reserve" && !["draft", "confirmed"].includes(move.move_state)) {
    throw new Error("Only draft or confirmed moves can be reserved.");
  }
  if (operation === "complete" && move.move_state !== "assigned") {
    throw new Error("Only reserved moves can be completed.");
  }
  if (operation === "cancel" && !["draft", "confirmed", "assigned"].includes(move.move_state)) {
    throw new Error("Completed moves cannot be cancelled directly.");
  }
  if (move.location_src_code === move.location_dest_code) {
    throw new Error("Source and destination locations must differ.");
  }

  if (operation === "reserve") {
    const srcQuant = (
      await stockQuantModel.repository.find(
        { product_sku: move.product_sku, location_code: move.location_src_code },
        { tenantId, limit: 1 },
      )
    )[0];
    if (!srcQuant || srcQuant.quantity - srcQuant.reserved_quantity < move.quantity) {
      throw new Error("Insufficient available stock in source location.");
    }
    await stockQuantModel.repository.update(
      srcQuant.id,
      { reserved_quantity: srcQuant.reserved_quantity + move.quantity },
      actor,
    );
  } else if (operation === "complete" || (operation === "cancel" && move.move_state === "assigned")) {
    const srcQuant = (
      await stockQuantModel.repository.find(
        { product_sku: move.product_sku, location_code: move.location_src_code },
        { tenantId, limit: 1 },
      )
    )[0];
    if (!srcQuant || srcQuant.reserved_quantity < move.quantity) {
      throw new Error("Reserved stock balance requires reconciliation.");
    }
    await stockQuantModel.repository.update(
      srcQuant.id,
      {
        reserved_quantity: srcQuant.reserved_quantity - move.quantity,
        ...(operation === "complete" ? { quantity: srcQuant.quantity - move.quantity } : {}),
      },
      actor,
    );
    if (operation === "complete") {
      const destQuant = (
        await stockQuantModel.repository.find(
          { product_sku: move.product_sku, location_code: move.location_dest_code },
          { tenantId, limit: 1 },
        )
      )[0];
      if (destQuant) {
        await stockQuantModel.repository.update(
          destQuant.id,
          { quantity: destQuant.quantity + move.quantity },
          actor,
        );
      } else {
        await stockQuantModel.repository.create(
          {
            product_sku: move.product_sku,
            location_code: move.location_dest_code,
            quantity: move.quantity,
            reserved_quantity: 0,
          },
          actor,
        );
      }
    }
  }

  return stockMoveModel.repository.update(move.id, { move_state: targetState }, actor);
}

export const stockMoveModel = defineModel({
  name: "stock.move",
  table: "stk_moves",
  schema: stockMoveSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["reference", "product_sku", "location_src_code", "location_dest_code"],
  publicFields: [
    "reference",
    "product_sku",
    "location_src_code",
    "location_dest_code",
    "quantity",
    "move_state",
  ],
  actions: {
    reserve: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Reserve Stock",
      handler: async ({ record, actor }): Promise<unknown> =>
        executeStockTransfer(String(record!.reference), "reserve", actor),
    },
    complete: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Complete Transfer",
      handler: async ({ record, actor }): Promise<unknown> =>
        executeStockTransfer(String(record!.reference), "complete", actor),
    },
    cancel: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Cancel Move",
      handler: async ({ record, actor }): Promise<unknown> =>
        executeStockTransfer(String(record!.reference), "cancel", actor),
    },
  },
  indexes: [
    { fields: ["tenant_id", "reference"], unique: true },
    { fields: ["move_state"] },
  ],
});

export const stockData: AddonDataRecord[] = [
  {
    id: "loc_wh_stock",
    model: "stock.location",
    key: { code: "WH-STOCK" },
    noupdate: true,
    values: { code: "WH-STOCK", name: "Main Warehouse", usage: "internal" },
  },
  {
    id: "loc_wh_output",
    model: "stock.location",
    key: { code: "WH-OUTPUT" },
    noupdate: true,
    values: { code: "WH-OUTPUT", name: "Staging Output", usage: "internal" },
  },
  {
    id: "prod_witness_node",
    model: "product.product",
    key: { sku: "MW-NODE-01" },
    noupdate: true,
    values: {
      sku: "MW-NODE-01",
      name: "Edge Telemetry Node",
      category: "hardware",
      product_type: "storable",
      list_price: 1500000,
      cost_price: 900000,
      uom: "Unit",
    },
  },
];

export const stockRules: IrRuleInput[] = [
  { model_name: "product.product", role: "viewer", can_read: true },
  { model_name: "product.product", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "product.product", role: "admin", can_read: true, can_create: true, can_update: true, can_delete: true },
  { model_name: "stock.location", role: "viewer", can_read: true },
  { model_name: "stock.location", role: "admin", can_read: true, can_create: true, can_update: true, can_delete: true },
  { model_name: "stock.quant", role: "viewer", can_read: true },
  { model_name: "stock.quant", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "stock.quant", role: "admin", can_read: true, can_create: true, can_update: true, can_delete: true },
  { model_name: "stock.move", role: "viewer", can_read: true },
  { model_name: "stock.move", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "stock.move", role: "admin", can_read: true, can_create: true, can_update: true, can_delete: true },
];

export const stockViews: IrViewInput[] = [
  {
    model_name: "stock.move",
    view_type: "list",
    spec: {
      title: "Stock Transfers",
      description: "Double-entry warehouse moves with reservation and completion states.",
      domainIcon: "arsy",
      columns: ["reference", "product_sku", "location_src_code", "location_dest_code", "quantity", "move_state"],
    },
  },
];

export const stockMenus: IrMenuInput[] = [
  {
    menu_key: "stock.moves",
    label: "Inventory & Stock",
    href: "/models/stock.move",
    icon: "arsy",
    plane: "operations",
    sort_order: 78,
    min_role: "viewer",
  },
];

export function createStockAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: stockManifest,
    models: [productProductModel, stockLocationModel, stockQuantModel, stockMoveModel],
    rules: stockRules,
    views: stockViews,
    menus: stockMenus,
    data: stockData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/stock/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [products, locations, quants, moves] = await Promise.all([
          productProductModel.repository.count({}, { tenantId }),
          stockLocationModel.repository.count({}, { tenantId }),
          stockQuantModel.repository.count({}, { tenantId }),
          stockMoveModel.repository.count({}, { tenantId }),
        ]);
        return { products, locations, quants, moves };
      });

      scope.post<{ Body: { reference?: string; operation?: "reserve" | "complete" | "cancel" } }>(
        `${prefix}/stock/transfer`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const { reference, operation } = request.body ?? {};
          if (!reference || !operation || !["reserve", "complete", "cancel"].includes(operation)) {
            return reply
              .code(400)
              .send({ error: "reference and operation ('reserve'|'complete'|'cancel') required" });
          }
          try {
            const actor = resolveActorContextFromBridge(auth, request);
            const move = await executeStockTransfer(reference, operation, actor);
            return reply.send({ move });
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return reply.code(400).send({ error: msg });
          }
        },
      );
    },
  };
}

export const stockAddon = createStockAddon();
