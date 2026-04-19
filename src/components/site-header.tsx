"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, CirclePlus, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger } from "@/components/command-search"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader({ onOpenCustomizer }: { onOpenCustomizer?: () => void }) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/8 bg-background/90 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-2 px-3 py-2 lg:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 hidden data-[orientation=vertical]:h-4 sm:block" />
          <div className="flex-1 max-w-sm">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" asChild size="sm" className="hidden sm:flex h-8">
              <Link href="/transfers/create">
                <CirclePlus className="h-4 w-4" />
                New Transfer
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="h-4 w-4" />
            </Button>
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={onOpenCustomizer} className="hidden sm:flex">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
