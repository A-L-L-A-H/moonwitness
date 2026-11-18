import { describe, expect, it } from "vitest";
import {
  mapFieldType,
  mapRuntimeViewToAutoDescriptor,
  mergeDynamicNavigation,
  resolveBindingUrl,
  type RuntimeNavMenuItem,
  type RuntimeViewDescriptorResponse,
} from "@/lib/api/meta-views";
import { navItems } from "@/components/shell/nav-items";

describe("dynamic addon metadata & navigation helpers", () => {
  it("maps runtime ir_model_fields into AutoModelViewDescriptor fields", () => {
    const view: RuntimeViewDescriptorResponse = {
      model: "timeline.event",
      table: "events",
      extensible: true,
      restEnabled: true,
      acl: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
      fields: [
        {
          id: "f1",
          model_name: "timeline.event",
          field_name: "title",
          field_type: "text",
          nullable: false,
          required: true,
          deprecated: false,
          is_custom: false,
          origin_addon: "timeline",
          ui_widget: "text",
          label: "Title",
          selection: null,
          default_value: null,
        },
        {
          id: "f2",
          model_name: "timeline.event",
          field_name: "severity",
          field_type: "selection",
          nullable: false,
          required: true,
          deprecated: false,
          is_custom: true,
          origin_addon: "__runtime",
          ui_widget: "select",
          label: "Severity",
          selection: ["low", "high"],
          default_value: "low",
        },
        {
          id: "f3",
          model_name: "timeline.event",
          field_name: "legacy_col",
          field_type: "text",
          nullable: true,
          required: false,
          deprecated: true,
          is_custom: false,
          origin_addon: "timeline",
          ui_widget: "text",
          label: "Legacy Col",
          selection: null,
          default_value: null,
        },
      ],
      views: [
        {
          view_type: "list",
          addon: "timeline",
          priority: 10,
          spec: { title: "Timeline Events", domainIcon: "scripture" },
        },
      ],
      actionBindings: {
        listUrl: "/api/v1/timeline/events",
        createUrl: "/api/v1/timeline/events",
        updateUrl: "/api/v1/timeline/events/{id}",
      },
    };

    const descriptor = mapRuntimeViewToAutoDescriptor(view);
    expect(descriptor.title).toBe("Timeline Events");
    expect(descriptor.fields).toHaveLength(2);
    expect(descriptor.fields[1]).toMatchObject({
      name: "severity",
      type: "select",
      isCustom: true,
      selection: ["low", "high"],
    });
    expect(resolveBindingUrl("/api/v1/timeline/events/{id}", "evt-1")).toBe(
      "/api/v1/timeline/events/evt-1",
    );
    expect(
      mapFieldType({
        ...view.fields[0]!,
        field_type: "integer",
        ui_widget: "number",
      }),
    ).toBe("integer");
  });

  it("merges dynamic ir_menus for the active plane without duplicating existing links", () => {
    const menus: RuntimeNavMenuItem[] = [
      {
        id: "m1",
        menu_key: "timeline.dock",
        addon: "timeline",
        parent_key: null,
        label: "Archive",
        href: "/dock",
        icon: "dot",
        plane: "creator",
        sort_order: 10,
        min_role: "viewer",
      },
      {
        id: "m2",
        menu_key: "addon.manager",
        addon: "__base",
        parent_key: null,
        label: "Addon Studio",
        href: "/addons",
        icon: "M4 6 L20 6",
        plane: "creator",
        sort_order: 95,
        min_role: "admin",
      },
      {
        id: "m3",
        menu_key: "ops.radius",
        addon: "radius",
        parent_key: null,
        label: "RADIUS",
        href: "/radius",
        icon: "dot",
        plane: "operations",
        sort_order: 40,
        min_role: "viewer",
      },
    ];

    const merged = mergeDynamicNavigation(navItems, menus, "creator");
    expect(
      merged.filter((i) => i.target.kind === "route" && i.target.href === "/dock"),
    ).toHaveLength(1);
    expect(merged.some((i) => i.id === "addon.manager" && i.label === "Addon Studio")).toBe(true);
    expect(merged.some((i) => i.id === "ops.radius")).toBe(false);
  });
});
