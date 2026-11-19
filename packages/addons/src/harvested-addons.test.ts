import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  defaultFailClosedAuthBridge,
  mailMessageModel,
  registerBaseAddon,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { createMizanAddon } from "./mizan/index.js";
import { createCelestialAddon } from "./celestial/index.js";
import { createKhidraAddon, irAutomationModel } from "./khidra/index.js";
import { createCabAddon } from "./cab/index.js";
import { createGeoAddon } from "./geo/index.js";
import { createAccountAddon } from "./account/index.js";
import { createStockAddon, stockQuantModel } from "./stock/index.js";
import { createCrmAddon } from "./crm/index.js";
import { createPerformanceAddon } from "./performance/index.js";
import { createObservatoryAddon } from "./observatory/index.js";
import { createAuthAddon } from "./auth/index.js";
import { createAuditAddon } from "./audit/index.js";
import { createWitnessResearchAddon } from "./witness-research/index.js";

describe("Harvested moonwitness-main domain addons: mizan, celestial, khidra, cab, geo", () => {
  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    await initDb("file::memory:?cache=shared");
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  it("mounts mizan, celestial, khidra, cab, and geo addons with full ORM & RPC integration", async () => {
    const app = Fastify({ logger: false });
    const runtime = new AddonRuntimeController();
    const auth: BaseAddonAuthBridge = {
      ...defaultFailClosedAuthBridge,
      authenticate: async () => undefined,
      requireRole: () => async () => undefined,
      getActorId: () => "admin-1",
      getActorRole: () => "admin",
      getActorTenant: () => "default",
      resolveActorContext: (req, source = "api") =>
        createActorContext("admin-1", source, req.id, "default"),
    };

    await runtime.syncAll(
      [
        {
          manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true },
          register: async () => {
            await registerBaseAddon(app, { runtime, auth, apiPrefix: "/api/v1" });
          },
        },
        createMizanAddon({ prefix: "/api/v1", auth }),
        createCelestialAddon({ prefix: "/api/v1", auth }),
        createKhidraAddon({ prefix: "/api/v1", auth }),
        createCabAddon({ prefix: "/api/v1", auth }),
        createGeoAddon({ prefix: "/api/v1", auth }),
        createAccountAddon({ prefix: "/api/v1", auth }),
        createStockAddon({ prefix: "/api/v1", auth }),
        createCrmAddon({ prefix: "/api/v1", auth }),
        createPerformanceAddon({ prefix: "/api/v1", auth }),
        createObservatoryAddon({ prefix: "/api/v1", auth }),
        createAuditAddon({ prefix: "/api/v1", auth }),
        createAuthAddon({ prefix: "/api/v1", auth, rateLimit: () => async () => undefined }),
        createWitnessResearchAddon({ prefix: "/api/v1", auth }),
      ],
      app,
    );
    await app.ready();

    try {
      // 1. Mizan: decision + evaluate (computes generalWeight=14, prophetic=3, total=17)
      const mzDec = await app.inject({
        method: "GET",
        url: "/api/v1/mizan/decision?generalSufficient=false&balanceSatisfied=true&internalReferenceVerified=true",
      });
      expect(mzDec.statusCode).toBe(200);
      expect(mzDec.json().decision.method).toBe("prophetic");

      const mzEval = await app.inject({
        method: "POST",
        url: "/api/v1/mizan/evaluate",
        payload: {
          case_key: "case-001",
          general_sufficient: false,
          balance_satisfied: true,
          internal_reference_verified: true,
          prophetic_reference_relevant: true,
          primary_filter_passed: true,
          secondary_filter_passed: true,
          power_right_score: 8,
          power_left_score: 6,
          prophetic_reference_weight: 3,
          rating: 4.2,
          confidence: "high",
        },
      });
      expect(mzEval.statusCode).toBe(201);
      expect(mzEval.json().assessment.method).toBe("prophetic");
      expect(mzEval.json().assessment.general_weight).toBe(14);
      expect(mzEval.json().assessment.total_weight).toBe(17);

      // 2. Celestial: AEQ4 clock, Hijri calendar, Jean Meeus lunar phase, and Qibla bearing
      const celNow = await app.inject({
        method: "GET",
        url: "/api/v1/celestial/now?lat=-6.2088&lng=106.8456",
      });
      expect(celNow.statusCode).toBe(200);
      expect(celNow.json().hijri.year).toBeGreaterThanOrEqual(1445);
      expect(celNow.json().qibla.qibla_bearing_deg).toBeCloseTo(295.15, 1);

      // 3. Khidra: create an on_create automation rule on cab.change -> auto-posts mail.message chatter!
      await irAutomationModel.repository.create({
        rule_key: "auto-rfc-chatter",
        name: "Notify on Critical RFC",
        target_model: "cab.change",
        trigger: "on_create",
        domain_json: JSON.stringify({ risk: "critical" }),
        action_type: "post_chatter",
        action_data_json: JSON.stringify({ body: "Khidra Alert: Critical RFC opened" }),
        active: true,
      });

      // 4. CAB: create a critical RFC and record an approval decision via RPC
      const rfcCreate = await app.inject({
        method: "POST",
        url: "/api/v1/m/cab.change",
        payload: {
          reference: "RFC-2026-01",
          title: "Upgrade Edge Sanctuary",
          description: "Zero-downtime rollout",
          risk: "critical",
        },
      });
      expect(rfcCreate.statusCode).toBe(201);
      const rfcId = rfcCreate.json().data.id as string;

      // Verify Khidra onModelWrite automation fired and created a chatter message!
      const chatter = await mailMessageModel.repository.find({
        res_model: "cab.change",
        res_id: rfcId,
      });
      expect(chatter).toHaveLength(1);
      expect(chatter[0]?.body).toBe("Khidra Alert: Critical RFC opened");

      const rfcDecision = await app.inject({
        method: "POST",
        url: `/api/v1/m/cab.change/${rfcId}/call/record_decision`,
        payload: { outcome: "approved", rationale: "All gates green" },
      });
      expect(rfcDecision.statusCode).toBe(200);
      expect(rfcDecision.json().data.change.change_status).toBe("approved");

      // 5. Geo: declarative Indonesian provinces & cities seeded via ir.model.data + ?with=cities hydration
      const geoSummary = await app.inject({
        method: "GET",
        url: "/api/v1/geo/summary",
      });
      expect(geoSummary.statusCode).toBe(200);
      expect(geoSummary.json().provinces).toBeGreaterThanOrEqual(6);
      expect(geoSummary.json().cities).toBeGreaterThanOrEqual(4);

      const jakartaHydrated = await app.inject({
        method: "GET",
        url: "/api/v1/m/geo.province?kemendagri_code=31&with=cities",
      });
      expect(jakartaHydrated.statusCode).toBe(200);
      expect(jakartaHydrated.json().data[0].$cities).toHaveLength(1);
      expect(jakartaHydrated.json().data[0].$cities[0].name).toContain("Jakarta Pusat");

      // 6. Celestial prayer-times & hilal
      const prayerRes = await app.inject({
        method: "GET",
        url: "/api/v1/celestial/prayer-times?lat=-6.2088&lng=106.8456&convention=KEMENAG",
      });
      expect(prayerRes.statusCode).toBe(200);
      expect(prayerRes.json().fajr).toMatch(/^\d{2}:\d{2}$/);

      const hilalRes = await app.inject({
        method: "GET",
        url: "/api/v1/celestial/hilal?altitude=4.2&elongation=7.5",
      });
      expect(hilalRes.statusCode).toBe(200);
      expect(hilalRes.json().mabims_criterion.passed).toBe(true);

      // 7. Witness-Research 9 deterministic engines
      const modsRes = await app.inject({ method: "GET", url: "/api/v1/witness/engine/modules" });
      expect(modsRes.statusCode).toBe(200);
      expect(modsRes.json().modules).toHaveLength(9);

      const engRunRes = await app.inject({
        method: "POST",
        url: "/api/v1/witness/engine/run",
        payload: { moduleCode: "lexical-analysis", input: { q: "w-z-n" } },
      });
      expect(engRunRes.statusCode).toBe(201);
      expect(engRunRes.json().output.findings.length).toBeGreaterThanOrEqual(1);

      // 8. Account: balanced ledger post + reversal, reject unbalanced
      const unbalanced = await app.inject({
        method: "POST",
        url: "/api/v1/account/ledger/post",
        payload: {
          move_key: "MV-BAD",
          idempotency_key: "idem-bad",
          lines: [
            { account_code: "1010", debit: 100, credit: 0 },
            { account_code: "4000", debit: 0, credit: 50 },
          ],
        },
      });
      expect(unbalanced.statusCode).toBe(400);

      const posted = await app.inject({
        method: "POST",
        url: "/api/v1/account/ledger/post",
        payload: {
          move_key: "MV-001",
          idempotency_key: "idem-001",
          lines: [
            { account_code: "1010", debit: 500, credit: 0 },
            { account_code: "4000", debit: 0, credit: 500 },
          ],
        },
      });
      expect(posted.statusCode).toBe(201);
      expect(posted.json().move.total_debit).toBe(500);

      // 9. Stock: seed quant -> create move -> reserve -> complete -> check quants
      await stockQuantModel.repository.create({
        product_sku: "MW-NODE-01",
        location_code: "WH-STOCK",
        quantity: 10,
        reserved_quantity: 0,
      });
      await app.inject({
        method: "POST",
        url: "/api/v1/m/stock.move",
        payload: {
          reference: "SM-001",
          product_sku: "MW-NODE-01",
          location_src_code: "WH-STOCK",
          location_dest_code: "WH-OUTPUT",
          quantity: 4,
        },
      });
      const reservedMove = await app.inject({
        method: "POST",
        url: "/api/v1/stock/transfer",
        payload: { reference: "SM-001", operation: "reserve" },
      });
      expect(reservedMove.statusCode).toBe(200);
      expect(reservedMove.json().move.move_state).toBe("assigned");

      const completedMove = await app.inject({
        method: "POST",
        url: "/api/v1/stock/transfer",
        payload: { reference: "SM-001", operation: "complete" },
      });
      expect(completedMove.statusCode).toBe(200);
      expect(completedMove.json().move.move_state).toBe("done");

      const srcQuantAfter = await stockQuantModel.repository.find({
        product_sku: "MW-NODE-01",
        location_code: "WH-STOCK",
      });
      expect(srcQuantAfter[0]?.quantity).toBe(6);

      // 10. CRM, Performance KPIs & Observatory feeds
      const leadRes = await app.inject({
        method: "POST",
        url: "/api/v1/m/crm.lead",
        payload: { lead_key: "LD-1", name: "Enterprise Node", expected_revenue: 1000, probability: 50 },
      });
      expect(leadRes.statusCode).toBe(201);
      expect(leadRes.json().data.weighted_revenue).toBe(500);

      const perfSummary = await app.inject({ method: "GET", url: "/api/v1/performance/summary" });
      expect(perfSummary.statusCode).toBe(200);
      expect(perfSummary.json().widgets.length).toBeGreaterThanOrEqual(3);

      const obsSummary = await app.inject({ method: "GET", url: "/api/v1/observatory/summary" });
      expect(obsSummary.statusCode).toBe(200);
      expect(obsSummary.json().feeds).toBeGreaterThanOrEqual(5);
    } finally {
      await app.close();
    }
  });
});
