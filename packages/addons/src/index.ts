import type { AddonDefinition, AddonHostContext } from "@moonwitness/addon-runtime";
import { createAiAddon } from "./ai/index.js";
import { createAuditAddon } from "./audit/index.js";
import { createAuthAddon } from "./auth/index.js";
import { createCanonLoreAddon } from "./canon-lore/index.js";
import { createCommandCenterAddon } from "./command-center/index.js";
import { createControlAddon } from "./control/index.js";
import { createEpistemicAddon } from "./epistemic/index.js";
import { createI18nAddon } from "./i18n/index.js";
import { createProbesAddon } from "./probes/index.js";
import { createRadiusAddon } from "./radius/index.js";
import { createSnmpAddon } from "./snmp/index.js";
import { createStorageAddon } from "./storage/index.js";
import { createSyslogAddon } from "./syslog/index.js";
import { createTimelineAddon } from "./timeline/index.js";
import { createWitnessResearchAddon } from "./witness-research/index.js";

export * from "./ai/index.js";
export * from "./audit/index.js";
export * from "./auth/index.js";
export * from "./canon-lore/index.js";
export * from "./command-center/index.js";
export * from "./control/index.js";
export * from "./epistemic/index.js";
export * from "./i18n/index.js";
export * from "./probes/index.js";
export * from "./radius/index.js";
export * from "./snmp/index.js";
export * from "./storage/index.js";
export * from "./syslog/index.js";
export * from "./timeline/index.js";
export * from "./witness-research/index.js";

/**
 * Returns the canonical 15 MoonWitness domain addons in topological dependency order.
 */
export function createPlatformAddons(host: AddonHostContext): AddonDefinition[] {
  const { prefix, auth } = host;
  return [
    createI18nAddon({ prefix, auth }),
    createAuditAddon({ prefix, auth }),
    createAuthAddon(host),
    createTimelineAddon(host),
    createControlAddon(host),
    createCommandCenterAddon(host),
    createProbesAddon(host),
    createAiAddon(host),
    createStorageAddon(host),
    createSnmpAddon(host),
    createSyslogAddon(host),
    createRadiusAddon(host),
    createCanonLoreAddon({ prefix, auth }),
    createWitnessResearchAddon({ prefix, auth }),
    createEpistemicAddon({ prefix, auth }),
  ];
}
