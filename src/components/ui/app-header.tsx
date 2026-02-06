'use client'

import { Brain, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'

export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-[5%] py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-xl tracking-tight">DeepRead</span>
          </Link>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link
              href="/settings"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border" />
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Francisco</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
