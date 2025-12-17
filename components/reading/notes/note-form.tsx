import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Sparkles } from 'lucide-react'
import { NoteColor } from './types'
import { ColorSelector } from './color-selector'

interface NoteFormProps {
  title: string
  content: string
  color: NoteColor
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onColorChange: (color: NoteColor) => void
  onSubmit: () => void
  onAIAction: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function NoteForm({
  title,
  content,
  color,
  onTitleChange,
  onContentChange,
  onColorChange,
  onSubmit,
  onAIAction,
  onKeyDown,
}: NoteFormProps) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Title (optional)"
        className="border-neutral-200 text-sm focus-visible:ring-neutral-400"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Textarea
        placeholder="Add a note..."
        className="min-h-[100px] resize-none border-neutral-200 text-sm leading-relaxed focus-visible:ring-neutral-400"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex items-center justify-between gap-3">
        <ColorSelector selectedColor={color} onColorChange={onColorChange} />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAIAction}
            className="text-xs h-9 px-3"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI Summary
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!content.trim()}
            className="text-xs h-9 px-4"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create
          </Button>
        </div>
      </div>
    </div>
  )
}
