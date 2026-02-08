'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, ArrowLeft, Loader2, BookOpen, Sparkles, Target } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Decorative */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 relative overflow-hidden bg-zinc-950">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        
        {/* Accent glows */}
        <div className="absolute top-1/4 right-0 w-72 h-72 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-60 h-60 lg:w-80 lg:h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Header Logo - aligned with content */}
        <div className="absolute top-6 left-8 lg:top-8 lg:left-16 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-lg lg:text-xl tracking-tight">DeepRead</span>
          </Link>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-8 lg:px-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="text-2xl lg:text-3xl font-medium text-white mb-3 lg:mb-4 tracking-tight">
              Read smarter.<br />
              <span className="text-zinc-500">Remember more.</span>
            </h1>
            <p className="text-zinc-400 text-sm lg:text-base mb-6 lg:mb-10 leading-relaxed">
              Transform your PDFs into organized, interactive reading experiences with AI-powered summaries.
            </p>

            {/* Feature cards - hidden on smaller tablets */}
            <div className="hidden lg:block space-y-3">
              {[
                { 
                  icon: <BookOpen className="h-4 w-4" />, 
                  title: 'From PDF to structured book',
                  desc: 'Auto-detected chapters & clean layout'
                },
                { 
                  icon: <Sparkles className="h-4 w-4" />, 
                  title: 'Grasp concepts faster',
                  desc: 'AI summaries that capture what matters'
                },
                { 
                  icon: <Target className="h-4 w-4" />, 
                  title: 'Track every milestone',
                  desc: 'Progress, streaks & achievements'
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="group flex items-center gap-3 lg:gap-4 p-2.5 lg:p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700/50 transition-all cursor-default"
                >
                  <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-white group-hover:text-blue-300 transition-colors flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{feature.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom quote */}
        <div className="absolute bottom-6 left-8 right-8 lg:bottom-10 lg:left-16 lg:right-16 z-10">
          <p className="text-xs lg:text-sm text-zinc-400 font-medium">
            &ldquo;Books are a uniquely portable magic.&rdquo;
          </p>
          <p className="text-[10px] lg:text-xs text-zinc-600 mt-1">— Stephen King</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col relative w-full md:w-3/5 lg:w-1/2">
        {/* Mobile/Tablet Header */}
        <header className="md:hidden border-b border-border/50 px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-xl tracking-tight">DeepRead</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
            {/* Back link - desktop */}
            <Link 
              href="/"
              className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 lg:mb-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
                Welcome back
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Enter your details to access your library
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link 
                    href="#"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 md:mt-8 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link 
                  href="#"
                  className="font-medium text-foreground hover:underline"
                >
                  Get started
                </Link>
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
