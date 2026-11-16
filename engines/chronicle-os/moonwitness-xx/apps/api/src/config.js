export { loadApiConfig as loadConfig } from "@moonwitness/config";

export function assertRuntimeConfig(config) {
  const required = ["databaseUrl", "redisUrl"];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }
}
