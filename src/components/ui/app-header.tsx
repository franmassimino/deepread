'use client'

import { Brain, Settings, User } from 'lucide-react'
import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-[5%] py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-xl tracking-tight">DeepRead</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-neutral-200" />
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              <User className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-900">Francisco</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
