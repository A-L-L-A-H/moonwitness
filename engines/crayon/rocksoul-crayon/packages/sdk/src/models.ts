/**
 * Transport-neutral model metadata/CRUD facade. The host supplies the HTTP or
 * AEP adapter; feature code depends only on this SDK contract.
 */
export type ModelRecord = Record<string, unknown>;
export type ModelWrite = Record<string, unknown>;
export interface ModelQuery { readonly page?: number; readonly limit?: number; readonly search?: string; readonly order?: string; readonly direction?: 'asc' | 'desc'; readonly [key: string]: unknown }
export interface ModelPage<T extends ModelRecord = ModelRecord> { readonly items: T[]; readonly total: number; readonly page: number; readonly limit: number; readonly totalPages: number }
export interface ModelTransport { request<T>(path: string, options?: { method?: 'POST' | 'PATCH' | 'DELETE'; body?: ModelWrite; query?: ModelQuery }): Promise<T> }
export interface ModelUpdateOptions { readonly expectedVersion?: string }
export interface ModelClient {
  list<T extends ModelRecord = ModelRecord>(model: string, query?: ModelQuery): Promise<ModelPage<T>>;
  read<T extends ModelRecord = ModelRecord>(model: string, id: string): Promise<T>;
  create<T extends ModelRecord = ModelRecord>(model: string, input: ModelWrite): Promise<T>;
  update<T extends ModelRecord = ModelRecord>(model: string, id: string, input: ModelWrite, options?: ModelUpdateOptions): Promise<T>;
  remove(model: string, id: string): Promise<{ id: string; deleted: boolean }>;
  metadata(model: string): Promise<unknown>;
  menu(): Promise<unknown>;
}
const modelPath = (model: string) => `/api/v1/models/${encodeURIComponent(model)}`;
export const createModelClient = (transport: ModelTransport): ModelClient => ({
  list: (model, query) => transport.request(modelPath(model), { query }),
  read: (model, id) => transport.request(`${modelPath(model)}/${encodeURIComponent(id)}`),
  create: (model, input) => transport.request(modelPath(model), { method: 'POST', body: input }),
  update: (model, id, input, options) => transport.request(`${modelPath(model)}/${encodeURIComponent(id)}`, { method: 'PATCH', body: options?.expectedVersion ? { ...input, expectedVersion: options.expectedVersion } : input }),
  remove: (model, id) => transport.request(`${modelPath(model)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  metadata: (model) => transport.request(`${modelPath(model)}/metadata`),
  menu: () => transport.request('/api/v1/models/menu'),
});
