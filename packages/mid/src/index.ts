import { createMidHandler } from "./app";
import type { MidEnv } from "./types";

const handleFetch = createMidHandler();

const worker = {
  async fetch(request: Request, env: MidEnv): Promise<Response> {
    return handleFetch(request, env);
  },
};

export { createMidHandler };
export { midFastifyPlugin } from "./plugin";
export type { MidFastifyPluginOptions } from "./plugin";
export * from "./types";
export * from "./crypto";
export * from "./db";
export default worker;
