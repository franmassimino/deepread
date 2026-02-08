'use client'

import { AppHeader } from '@/components/ui/app-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Check, CreditCard, Download, Sparkles, Zap, User, Settings, LogOut, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: <User className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Billing', href: '/settings/billing', icon: <CreditCard className="h-4 w-4" /> },
]

const secondaryNavItems: NavItem[] = [
  { label: 'My Library', href: '/library', icon: <BookOpen className="h-4 w-4" /> },
]

const currentPlan = {
  name: 'Pro',
  price: '$9/month',
  status: 'active',
  renewsOn: 'March 7, 2026',
  features: [
    'Unlimited books',
    'Advanced AI summaries',
    'Priority processing',
    'Notes & highlights',
    'Email support',
  ]
}

const paymentMethods = [
  {
    id: '1',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2027,
    isDefault: true,
  }
]

const invoices = [
  { id: 'INV-001', date: 'Feb 7, 2026', amount: '$9.00', status: 'paid' },
  { id: 'INV-002', date: 'Jan 7, 2026', amount: '$9.00', status: 'paid' },
]

export default function BillingPage() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="mx-auto max-w-7xl py-8 pb-16 px-[5%]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Account Settings
            </h2>
            <p className="mt-2 text-muted-foreground">
              Manage your profile, preferences, and billing
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* User Card */}
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt="Francisco" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      F
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Francisco</p>
                    <p className="text-xs text-muted-foreground truncate">francisco@example.com</p>
                  </div>
                </div>
              </div>

              {/* Main Navigation */}
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Account
                </p>
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <Separator />

              {/* Secondary Navigation */}
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  General
                </p>
                {secondaryNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <Separator />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-6">Billing</h3>

            <div className="grid gap-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>You are currently on the Pro plan</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">$9</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Your plan renews on <span className="font-medium text-foreground">{currentPlan.renewsOn}</span>
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-3">What's included:</p>
                    <ul className="space-y-2">
                      {currentPlan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Manage your payment options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-14 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                            <span className="text-white text-xs font-bold tracking-wider">VISA</span>
                          </div>
                          <div>
                            <p className="font-medium">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View and download your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{invoice.amount}</span>
                          <Badge variant="secondary" className="capitalize">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade CTA */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5" />
                    <Badge className="bg-white/20 text-white border-0">Popular</Badge>
                  </div>
                  <CardTitle className="text-white">Team Plan</CardTitle>
                  <CardDescription className="text-blue-100">
                    Perfect for small teams and study groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">$29</span>
                    <span className="text-blue-100">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Everything in Pro',
                      'Up to 5 members',
                      'Shared library',
                      'Team analytics',
                      'Priority support',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-blue-100">
                        <Check className="h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-white text-blue-600 hover:bg-white/90">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Team
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </main>
    </div>
  )
}
