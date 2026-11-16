declare namespace JSX {
  interface IntrinsicElements { [elemName: string]: any }
  interface Element {}
}
declare module "react" {
  export type ReactNode = any;
  export type DependencyList = readonly unknown[];
  export type Dispatch<T> = (value:T | ((prev:T)=>T))=>void;
  export interface HTMLAttributes<T> { className?: string; children?: ReactNode; [key:string]: any }
  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> { onClick?: (e:any)=>void; disabled?: boolean; type?: string }
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> { value?: any; placeholder?: string; onChange?: (e:{target:T})=>void }
  export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {}
  export function useState<T>(initial:T | (()=>T)): [T, Dispatch<T>];
  export function useEffect(effect:()=>void|(()=>void), deps?:DependencyList): void;
  export function forwardRef<T,P>(render:(props:P,ref:any)=>any): any;
  export const StrictMode: any;
}
declare module "react-dom/client" {
  export function createRoot(el: Element): { render(node:any): void };
}
declare module "react/jsx-runtime" { export const jsx:any; export const jsxs:any; export const Fragment:any; }
