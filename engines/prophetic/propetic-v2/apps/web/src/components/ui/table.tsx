import * as React from "react"; import { cn } from "../../lib/utils";
export function Table({className,...props}:React.TableHTMLAttributes<HTMLTableElement>){return <div className="relative w-full overflow-auto"><table className={cn("w-full caption-bottom text-sm",className)} {...props}/></div>}
export function THead(props:React.HTMLAttributes<HTMLTableSectionElement>){return <thead className="[&_tr]:border-b" {...props}/>}
export function TBody(props:React.HTMLAttributes<HTMLTableSectionElement>){return <tbody className="[&_tr:last-child]:border-0" {...props}/>}
export function Tr(props:React.HTMLAttributes<HTMLTableRowElement>){return <tr className="border-b transition-colors hover:bg-muted/50" {...props}/>}
export function Th(props:React.ThHTMLAttributes<HTMLTableCellElement>){return <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props}/>}
export function Td(props:React.TdHTMLAttributes<HTMLTableCellElement>){return <td className="p-4 align-middle" {...props}/>}
