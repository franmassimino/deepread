'use client'

import { Sparkles, StickyNote, Highlighter, MessageSquare, BookmarkPlus } from 'lucide-react'
import { Button } from './button'
import type { HighlightColor } from './highlighter-toolbar'

interface TextSelectionPopoverProps {
  position: { x: number; y: number }
  onAction: (action: string) => void
  selectedColor: HighlightColor
}

export function TextSelectionPopover({ position, onAction, selectedColor }: TextSelectionPopoverProps) {
  const colorClasses = {
    yellow: 'bg-yellow-200',
    green: 'bg-green-200',
    blue: 'bg-blue-200',
    pink: 'bg-pink-200',
    orange: 'bg-orange-200',
  }

  return (
    <div
      data-text-selection-popover
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <div className="rounded-lg border border-border bg-background shadow-lg">
        <div className="flex items-center gap-1 p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-xs"
            onClick={() => onAction('highlight')}
          >
            <div className={`h-4 w-4 rounded border border-border ${colorClasses[selectedColor]}`} />
            Subrayar
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-xs"
            onClick={() => onAction('ask-ai')}
          >
            <Sparkles className="h-4 w-4" />
            Preguntarle a la IA
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-xs"
            onClick={() => onAction('add-note')}
          >
            <StickyNote className="h-4 w-4" />
            Agregar nota
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-xs"
            onClick={() => onAction('create-flashcard')}
          >
            <BookmarkPlus className="h-4 w-4" />
            Crear flashcard
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-xs"
            onClick={() => onAction('explain')}
          >
            <MessageSquare className="h-4 w-4" />
            Explicar
          </Button>
        </div>
      </div>
    </div>
  )
}
