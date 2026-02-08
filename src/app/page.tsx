'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, Sparkles, Zap, Library, Upload, Brain, Check, 
  Moon, Sun, ChevronDown, 
  BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: ['5 books', 'Basic AI summaries', 'Standard processing', 'Community support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For serious readers',
    features: ['Unlimited books', 'Advanced AI summaries', 'Priority processing', 'Notes & highlights', 'Email support'],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For small teams',
    features: ['Everything in Pro', 'Up to 5 members', 'Shared library', 'Team analytics', 'Priority support'],
    cta: 'Contact Sales',
    popular: false,
  },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default function WelcomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* Animated Background */}
      <motion.div 
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 via-transparent to-transparent dark:from-zinc-950/50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80"
      >
        <div className="mx-auto max-w-7xl px-[5%] py-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-xl tracking-tight">DeepRead</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                Start Reading
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-[5%] relative">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100">
              <Sparkles className="h-3 w-3 mr-1" />
              Now in Beta
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6"
          >
            Read PDFs the way
            <br />
            <span className="relative">
              they should be read
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <motion.path
                  d="M0 8 Q75 0, 150 8 T300 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-blue-500/30"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </motion.svg>
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Transform your PDFs into organized, interactive reading experiences. 
            AI-powered summaries, chapter detection, and a clean reading interface.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-16"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Preview Card */}
      <section id="features" className="py-16 px-[5%]">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-50">
                How it works
              </Badge>
              <h3 className="text-3xl font-semibold tracking-tight mb-4">
                Your library, beautifully organized
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Upload any PDF and watch it transform into a structured book with chapters, 
                summaries, and progress tracking.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Upload className="h-4 w-4" />, title: 'Upload', desc: 'Drag & drop your PDFs' },
                  { icon: <Brain className="h-4 w-4" />, title: 'Process', desc: 'AI analyzes and structures' },
                  { icon: <BookOpen className="h-4 w-4" />, title: 'Read', desc: 'Enjoy clean reading' },
                ].map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {step.title}
                        <span className="text-muted-foreground">{step.icon}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
              
              {/* Browser mockup */}
              <div className="relative rounded-xl bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/10 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="max-w-xs mx-auto h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                      deepread.app/library
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold">Your Library</h4>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">3 books</Badge>
                  </div>
                  
                  {/* Book cards */}
                  <div className="space-y-3">
                    {[
                      { title: 'Designing Data-Intensive Apps', author: 'Martin Kleppmann', color: 'bg-blue-500', progress: 65 },
                      { title: 'The Psychology of Money', author: 'Morgan Housel', color: 'bg-emerald-500', progress: 30 },
                      { title: 'Designing Data-Intensive Apps', author: 'Martin Kleppmann', color: 'bg-blue-500', progress: 65 },
                    ].map((book) => (
                      <div key={book.title} className="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <div className={`w-10 h-12 rounded ${book.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {book.title.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground">{book.author}</p>
                          <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${book.color}`} 
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-[5%]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100">
              Features
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-muted-foreground">
              A complete reading experience, powered by AI
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Upload className="h-5 w-5" />, title: 'PDF Upload', desc: 'Drag and drop your PDFs. We handle the rest.' },
              { icon: <Brain className="h-5 w-5" />, title: 'AI Processing', desc: 'Automatic chapter detection and summaries.' },
              { icon: <BookOpen className="h-5 w-5" />, title: 'Clean Reading', desc: 'Distraction-free, organized reading experience.' },
              { icon: <Library className="h-5 w-5" />, title: 'Your Library', desc: 'All your books, organized and searchable.' },
              { icon: <Sparkles className="h-5 w-5" />, title: 'Smart Notes', desc: 'Take notes and highlight as you read.' },
              { icon: <Zap className="h-5 w-5" />, title: 'Fast & Local', desc: 'Everything processes locally. Your data stays yours.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-[5%] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Pricing
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground">
                Choose the plan that fits your reading habits. No hidden fees.
              </p>
            </motion.div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                {/* Popular plan glow effect */}
                {plan.popular && (
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500/30 to-blue-600/10 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                
                <Card className={`relative h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-xl gap-3 group-hover:shadow-zinc-900/5 dark:group-hover:shadow-black/20 group-hover:-translate-y-1 ${
                  plan.popular 
                    ? 'border-blue-500/30 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-zinc-900' 
                    : 'border-border/50 bg-card/50 backdrop-blur-sm'
                }`}>
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-bl from-blue-600 to-blue-700 text-white text-[10px] font-medium px-3 py-1 rounded-bl-xl">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col pt-0">
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
                        {plan.period && (
                          <span className="text-muted-foreground text-lg">{plan.period}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                            plan.popular 
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Button 
                      size="lg"
                      className={`w-full transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.02]' 
                          : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Trust note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-[5%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-950/20 pointer-events-none" />
        <div className="mx-auto max-w-7xl text-center relative">
          <div className="mb-6">
            <span className="text-6xl">📖</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Ready to transform your reading?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of readers who have already discovered a better way to read PDFs.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-[5%]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 DeepRead. Built for focused learning.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="mailto:hello@deepread.app" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
