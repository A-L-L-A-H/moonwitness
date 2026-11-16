declare namespace NodeJS { interface ProcessEnv { [key:string]: string | undefined } }
declare class Buffer extends Uint8Array {}
declare const process: {
  argv: string[];
  exitCode?: number;
  cwd(): string;
  env: NodeJS.ProcessEnv;
  on(event:string,listener:(...args:any[])=>void): void;
  exit(code?:number): never;
  execPath: string;
};
declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
  export function readFileSync(path: string): Buffer;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function mkdirSync(path: string, options?: {recursive?: boolean}): string | undefined;
  export function rmSync(path: string, options?: {recursive?: boolean; force?: boolean}): void;
  export function existsSync(path: string): boolean;
  const fs: {readFileSync: typeof readFileSync; writeFileSync: typeof writeFileSync; mkdirSync: typeof mkdirSync; rmSync: typeof rmSync; existsSync: typeof existsSync};
  export default fs;
}
declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function dirname(p: string): string;
  export function join(...paths: string[]): string;
  export function extname(p: string): string;
  export const sep: string;
  const path: {resolve: typeof resolve; dirname: typeof dirname; join: typeof join; extname:typeof extname; sep:typeof sep};
  export default path;
}
declare module "node:url" { export function fileURLToPath(url: string | URL): string; }
declare module "node:crypto" {
  interface Hash { update(data:string|Buffer):Hash; digest(encoding:"hex"):string }
  export function createHash(algorithm:string):Hash;
}
declare module "node:assert/strict" { const assert: {equal(a: unknown,b: unknown,msg?: string): void; ok(v: unknown,msg?: string): void; deepEqual?(a: unknown,b: unknown,msg?:string):void}; export default assert; }
declare module "node:test" { export default function test(name: string, fn: () => void | Promise<void>): void; }
declare module "node:http"{
  export interface IncomingMessage{method?:string;url?:string;headers?:Record<string,string|string[]|undefined>}
  export interface ServerResponse{statusCode:number;setHeader(name:string,value:string):void;end(data?:string|Buffer):void}
  export interface Server{listen(port:number,callback?:()=>void):void;listen(port:number,host:string,callback?:()=>void):void;close(callback?:()=>void):void}
  export function createServer(handler:(req:IncomingMessage,res:ServerResponse)=>void):Server;
  const http:{createServer:typeof createServer}; export default http;
}
declare module "node:sqlite" {
  export class StatementSync {
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export class DatabaseSync {
    constructor(path: string, options?:{readOnly?:boolean});
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
