'use client'

import { Highlighter } from 'lucide-react'
import { Button } from './button'
import { cn } from "@/lib/utils/utils"

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

interface HighlighterToolbarProps {
  selectedColor: HighlightColor
  onColorSelect: (color: HighlightColor) => void
}

const colors: { value: HighlightColor; label: string; className: string }[] = [
  { value: 'yellow', label: 'Amarillo', className: 'bg-yellow-200 hover:bg-yellow-300' },
  { value: 'green', label: 'Verde', className: 'bg-green-200 hover:bg-green-300' },
  { value: 'blue', label: 'Azul', className: 'bg-blue-200 hover:bg-blue-300' },
  { value: 'pink', label: 'Rosa', className: 'bg-pink-200 hover:bg-pink-300' },
  { value: 'orange', label: 'Naranja', className: 'bg-orange-200 hover:bg-orange-300' },
]

export function HighlighterToolbar({ selectedColor, onColorSelect }: HighlighterToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Highlighter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Rotulador:</span>
      </div>
      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={cn(
              'h-7 w-7 rounded border-2 transition-all',
              color.className,
              selectedColor === color.value
                ? 'border-foreground ring-2 ring-foreground ring-offset-1'
                : 'border-border hover:border-muted-foreground/60'
            )}
            title={color.label}
            aria-label={color.label}
          />
        ))}
      </div>
    </div>
  )
}
