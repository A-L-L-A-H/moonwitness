import fs from "node:fs";
import type { Dataset } from "../types.js";
import { dataPath } from "./paths.js";
export function loadDataset(filePath = dataPath): Dataset {
  return JSON.parse(fs.readFileSync(filePath,"utf8")) as Dataset;
}
