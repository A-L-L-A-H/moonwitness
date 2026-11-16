export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(" "); }
export function title(value: unknown) { return typeof value === "string" ? value.replaceAll("_", " ") : "—"; }
export function jsonEntries(value: unknown): Array<[string, unknown]> { return value && typeof value === "object" ? Object.entries(value as Record<string,unknown>) : []; }
