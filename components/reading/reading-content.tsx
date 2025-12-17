import { ScrollArea } from '@/components/ui/scroll-area'
import { TextSelectionPopover } from '@/components/ui/text-selection-popover'
import type { HighlightColor } from '@/components/ui/highlighter-toolbar'
import type { Chapter } from '@/lib/mock-book-data'

interface ReadingContentProps {
  chapter: Chapter
  showPopover: boolean
  popoverPosition: { x: number; y: number }
  selectedColor: HighlightColor
  onAction: (action: string) => void
}

export function ReadingContent({
  chapter,
  showPopover,
  popoverPosition,
  selectedColor,
  onAction,
}: ReadingContentProps) {
  return (
    <ScrollArea className="h-full">
      {showPopover && (
        <TextSelectionPopover
          position={popoverPosition}
          onAction={onAction}
          selectedColor={selectedColor}
        />
      )}

      <div id="reading-content" className="mx-auto max-w-5xl p-8 py-10">
        <h1 className="text-3xl font-bold mb-6 text-neutral-900">
          {chapter.title}
        </h1>

        <div
          className="prose prose-neutral prose-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />
      </div>
    </ScrollArea>
  )
}
