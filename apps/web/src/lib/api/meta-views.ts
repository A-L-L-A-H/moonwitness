"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AutoModelFieldSpec,
  AutoModelFieldType,
  AutoModelRow,
  AutoModelViewDescriptor,
} from "@moonwitness/ui";
import { navHref, type NavItem } from "@/components/shell/nav-items";

export interface RuntimeMetaAddon {
  id: string;
  name: string;
  addon_version: string;
  description: string;
  category: string;
  state: "installed" | "disabled" | "upgrade_pending" | "error";
  auto_install: boolean;
  last_error: string | null;
  enabled: boolean;
}

export interface RuntimeNavMenuItem {
  id: string;
  menu_key: string;
  addon: string;
  parent_key: string | null;
  label: string;
  href: string;
  icon: string;
  plane: "creator" | "operations" | "public";
  sort_order: number;
  min_role: "admin" | "editor" | "viewer" | "public";
}

export interface RuntimeMetaField {
  id: string;
  model_name: string;
  field_name: string;
  field_type: "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection";
  nullable: boolean;
  required: boolean;
  deprecated: boolean;
  is_custom: boolean;
  origin_addon: string;
  ui_widget: string;
  label: string;
  selection: string[] | null;
  default_value: unknown;
}

export interface RuntimeCustomActionSpec {
  id: string;
  label: string;
  method: "POST" | "PATCH" | "DELETE";
  urlTemplate: string;
  roles: Array<"admin" | "editor" | "viewer">;
}

export interface RuntimeActionBindings {
  listUrl?: string;
  createUrl?: string;
  updateUrl?: string;
  archiveUrl?: string;
  restoreUrl?: string;
  deleteUrl?: string;
  historyUrl?: string;
  customActions?: RuntimeCustomActionSpec[];
}

export interface RuntimeViewDescriptorResponse {
  model: string;
  table: string;
  extensible: boolean;
  restEnabled: boolean;
  acl: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  fields: RuntimeMetaField[];
  views: Array<{
    view_type: "list" | "form" | "detail" | "kanban";
    addon: string;
    priority: number;
    spec: Record<string, unknown>;
  }>;
  actionBindings: RuntimeActionBindings;
}

const DEFAULT_MENU_ICON_PATH = "M4 7 L12 3 L20 7 L12 11 Z M4 12 L12 16 L20 12 M4 17 L12 21 L20 17";

function getCsrfHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)mw_csrf=([^;]+)/);
  if (!match?.[1]) return {};
  return { "x-csrf-token": decodeURIComponent(match[1]) };
}

async function fetchApiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...getCsrfHeaders(),
    ...(init?.body ? { "content-type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export function resolveBindingUrl(template: string, id?: string): string {
  return id === undefined ? template : template.replace(/\{id\}/g, encodeURIComponent(id));
}

export function mapFieldType(field: RuntimeMetaField): AutoModelFieldType {
  if (field.selection && field.selection.length > 0) return "select";
  switch (field.ui_widget) {
    case "textarea":
      return "textarea";
    case "tags":
      return "tags";
    case "select":
      return "select";
    case "date":
      return "date";
    case "checkbox":
      return "boolean";
    case "number":
      return field.field_type === "integer" ? "integer" : "number";
  }
  switch (field.field_type) {
    case "integer":
      return "integer";
    case "real":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "selection":
      return "select";
    default:
      return "text";
  }
}

export function mapRuntimeViewToAutoDescriptor(
  view: RuntimeViewDescriptorResponse,
  overrides: Partial<
    Pick<AutoModelViewDescriptor, "title" | "description" | "domainIcon" | "cutoutId">
  > = {},
): AutoModelViewDescriptor {
  const fields: AutoModelFieldSpec[] = view.fields
    .filter((f) => !f.deprecated)
    .map((f) => ({
      name: f.field_name,
      label: f.label || f.field_name,
      type: mapFieldType(f),
      required: f.required,
      isCustom: f.is_custom,
      selection: f.selection ?? undefined,
    }));

  const primarySpec = view.views[0]?.spec ?? {};
  return {
    model: view.model,
    title:
      overrides.title ?? (typeof primarySpec.title === "string" ? primarySpec.title : view.model),
    description:
      overrides.description ??
      (typeof primarySpec.description === "string" ? primarySpec.description : undefined),
    domainIcon:
      overrides.domainIcon ??
      (typeof primarySpec.domainIcon === "string" ? primarySpec.domainIcon : undefined),
    cutoutId: overrides.cutoutId,
    fields,
    acl: view.acl,
  };
}

export function mergeDynamicNavigation(
  staticItems: readonly NavItem[],
  menus: readonly RuntimeNavMenuItem[],
  plane: "creator" | "operations",
): NavItem[] {
  const existingHrefs = new Set(staticItems.map((item) => navHref(item)));
  const additions = menus
    .filter((menu) => menu.plane === plane && !existingHrefs.has(menu.href))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map<NavItem>((menu) => ({
      id: menu.menu_key,
      label: menu.label,
      icon: menu.icon.startsWith("M") ? menu.icon : DEFAULT_MENU_ICON_PATH,
      target: { kind: "route", href: menu.href },
    }));

  return [...staticItems, ...additions];
}

export async function fetchMetaNavigation(): Promise<RuntimeNavMenuItem[]> {
  try {
    const res = await fetch("/api/v1/_meta/navigation", { credentials: "include" });
    if (!res.ok) return [];
    const data = (await res.json()) as { menus?: RuntimeNavMenuItem[] };
    return Array.isArray(data.menus) ? data.menus : [];
  } catch {
    return [];
  }
}

export function useMetaNavigation(
  plane: "creator" | "operations",
  staticItems: readonly NavItem[],
  enabled = true,
): NavItem[] {
  const [dynamicMenus, setDynamicMenus] = useState<RuntimeNavMenuItem[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchMetaNavigation()
      .then((menus) => {
        if (active && menus.length > 0) setDynamicMenus(menus);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  return mergeDynamicNavigation(staticItems, dynamicMenus, plane);
}

export function useMetaView(model: string) {
  const [data, setData] = useState<RuntimeViewDescriptorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const view = await fetchApiJson<RuntimeViewDescriptorResponse>(
        `/api/v1/_meta/views/${encodeURIComponent(model)}`,
      );
      setData(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model view descriptor");
    } finally {
      setLoading(false);
    }
  }, [model]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { view: data, loading, error, reload };
}

export function useModelRows(model: string, listUrl?: string) {
  const [rows, setRows] = useState<AutoModelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = listUrl ?? `/api/v1/m/${encodeURIComponent(model)}`;

  const reload = useCallback(async () => {
    if (!listUrl) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchApiJson<{ data?: AutoModelRow[] } | AutoModelRow[]>(targetUrl);
      const list = Array.isArray(payload) ? payload : (payload.data ?? []);
      setRows(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rows");
    } finally {
      setLoading(false);
    }
  }, [listUrl, targetUrl]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, loading, error, reload };
}

export function useMetaAddons() {
  const [addons, setAddons] = useState<RuntimeMetaAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApiJson<{ addons: RuntimeMetaAddon[] }>("/api/v1/_meta/addons");
      setAddons(res.addons ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load addons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = useCallback(
    async (name: string, nextEnabled: boolean) => {
      const action = nextEnabled ? "enable" : "disable";
      await fetchApiJson(`/api/v1/_meta/addons/${encodeURIComponent(name)}/${action}`, {
        method: "POST",
      });
      await reload();
    },
    [reload],
  );

  return { addons, loading, error, reload, toggle };
}

export async function registerCustomFieldRequest(
  model: string,
  input: {
    field_name: string;
    field_type: "text" | "integer" | "real" | "boolean" | "date" | "json" | "selection";
    required?: boolean;
    label?: string;
    selection?: string[];
  },
) {
  return fetchApiJson<{ field: RuntimeMetaField }>(
    `/api/v1/_meta/models/${encodeURIComponent(model)}/fields`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function executeModelMutation(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
) {
  return fetchApiJson<unknown>(url, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
