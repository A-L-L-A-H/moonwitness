import type { RIRDocument, RIRNode } from "allah-crayon-rir";

export type TextDirection = "ltr" | "rtl" | "auto";

export interface LocalizationContext {
  locale: string;
  direction: TextDirection;
}

export interface LocalizationKey {
  nodeId: string;
  nodeKind: RIRNode["kind"];
  field: "label" | "intent";
  semanticRef?: string;
}

export type Translator = (text: string, key: LocalizationKey, context: LocalizationContext) => string;

export interface LocalizedRIR {
  document: RIRDocument;
  locale: string;
  direction: TextDirection;
}

export function localizeRIR(
  document: RIRDocument,
  context: LocalizationContext,
  translate: Translator,
): LocalizedRIR {
  assertContext(context);
  const nodes = document.nodes.map((node) => localizeNode(node, context, translate));
  return deepFreeze({
    document: { ...structuredClone(document), nodes },
    locale: context.locale,
    direction: context.direction,
  });
}

function localizeNode(node: RIRNode, context: LocalizationContext, translate: Translator): RIRNode {
  const clone = structuredClone(node) as RIRNode;
  if ("label" in clone && typeof clone.label === "string") {
    clone.label = translate(clone.label, {
      nodeId: clone.id,
      nodeKind: clone.kind,
      field: "label",
      semanticRef: clone.semanticRef,
    }, context);
  }
  if (clone.kind === "path") {
    clone.intent = translate(clone.intent, {
      nodeId: clone.id,
      nodeKind: clone.kind,
      field: "intent",
      semanticRef: clone.semanticRef,
    }, context);
  }
  return clone;
}

function assertContext(context: LocalizationContext): void {
  if (!context.locale) throw new Error("Localization locale is required.");
  if (!(["ltr", "rtl", "auto"] as const).includes(context.direction)) throw new Error("Unsupported text direction.");
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
