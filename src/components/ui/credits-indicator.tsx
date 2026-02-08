'use client'

import { Coins, Loader2 } from 'lucide-react'
import { useCreditsStore } from '@/lib/stores/credits-store'
import Link from 'next/link'

interface CreditsIndicatorProps {
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  href?: string
}

const sizeClasses = {
  sm: {
    container: 'h-8 px-2.5 gap-1.5',
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
  },
  md: {
    container: 'h-10 px-3 gap-2',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    container: 'h-12 px-4 gap-2.5',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
}

export function CreditsIndicator({ 
  showIcon = true, 
  size = 'sm',
  isLoading = false,
  href = '/credits'
}: CreditsIndicatorProps) {
  const credits = useCreditsStore((state) => state.credits)
  const sizeClass = sizeClasses[size]

  const content = (
    <>
      {showIcon && (
        isLoading ? (
          <Loader2 className={`${sizeClass.icon} animate-spin`} />
        ) : (
          <Coins className={sizeClass.icon} />
        )
      )}
      <span className={sizeClass.text}>
        {isLoading ? '...' : credits.toLocaleString()}
      </span>
    </>
  )

  return (
    <Link
      href={href}
      className={`
        inline-flex items-center justify-center 
        rounded-full bg-primary/10
        text-primary
        font-medium whitespace-nowrap
        hover:bg-primary/20 
        active:scale-95
        transition-all duration-200
        cursor-pointer
        ${sizeClass.container}
      `}
      title={`${isLoading ? 'Cargando créditos...' : `${credits} créditos disponibles - Click para ver detalles`}`}
    >
      {content}
    </Link>
  )
}
