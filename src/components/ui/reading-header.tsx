'use client'

import { Brain, Settings, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

export function ReadingHeader() {
  const router = useRouter()

  const handleLogout = () => {
    router.push('/')
  }

  return (
    <header className="border-b bg-background">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-base">DeepRead</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Settings - Link directo */}
            <Link
              href="/settings"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <div className="h-5 w-px bg-border" />

            {/* Profile Popover - Simplified */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-colors">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Francisco</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">Francisco</p>
                  <p className="text-xs text-muted-foreground">francisco@example.com</p>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-col gap-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Account Settings
                  </Link>
                </div>
                <Separator className="my-2" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  )
}
