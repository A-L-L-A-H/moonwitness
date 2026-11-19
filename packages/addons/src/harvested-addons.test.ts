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
    } finally {
      await app.close();
    }
  });
});
