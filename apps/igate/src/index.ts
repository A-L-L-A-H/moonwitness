import { createIgateHandler } from "./app";
import type { IgateEnv } from "./types";

const handler = createIgateHandler();

export { createIgateHandler };
export type {
  D1DatabaseLike,
  D1PreparedStatementLike,
  IgateEnv,
  IgateNodeRecord,
  IgateProbeEventRecord,
} from "./types";

export default {
  fetch(request: Request, env: IgateEnv): Promise<Response> {
    return handler(request, env);
  },
};
