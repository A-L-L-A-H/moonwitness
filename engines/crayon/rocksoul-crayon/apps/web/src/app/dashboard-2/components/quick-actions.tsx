"use client"

import { Plus, Settings, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function QuickActions() {
  return (
    <div className="flex items-center space-x-2">
      <Button className="min-h-10 cursor-pointer">
        <Plus aria-hidden="true" className="h-4 w-4 mr-2" />
        New Sale
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-h-10 cursor-pointer">
            <Settings aria-hidden="true" className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer">
            <FileText aria-hidden="true" className="h-4 w-4 mr-2" />
            Generate Report
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Download aria-hidden="true" className="h-4 w-4 mr-2" />
            Export Data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <Settings aria-hidden="true" className="h-4 w-4 mr-2" />
            Dashboard Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
