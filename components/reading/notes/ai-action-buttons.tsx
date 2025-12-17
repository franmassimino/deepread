import { Button } from '@/components/ui/button'
import { Wand2, Lightbulb, BookOpen } from 'lucide-react'

interface AIActionButtonsProps {
  noteId?: string
  onAction: (action: string, noteId?: string) => void
}

export function AIActionButtons({ noteId, onAction }: AIActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-200">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('expand', noteId)}
        className="text-xs h-7 px-2"
      >
        <Wand2 className="h-3 w-3 mr-1" />
        Expand with AI
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('simplify', noteId)}
        className="text-xs h-7 px-2"
      >
        <Lightbulb className="h-3 w-3 mr-1" />
        Simplify
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('add-examples', noteId)}
        className="text-xs h-7 px-2"
      >
        <BookOpen className="h-3 w-3 mr-1" />
        Add Examples
      </Button>
    </div>
  )
}
