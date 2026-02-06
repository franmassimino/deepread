import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChaptersPopover } from './chapters-popover'
import type { Chapter } from '@/lib/utils/mock-book-data'

interface ChapterNavigationBarProps {
  bookId: string
  bookTitle: string
  chapters: Chapter[]
  currentChapter: Chapter
}

export function ChapterNavigationBar({
  bookId,
  bookTitle,
  chapters,
  currentChapter,
}: ChapterNavigationBarProps) {
  return (
    <div className="border-b bg-background">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/book/${bookId}`}
                className="inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="mx-2 h-4 w-px bg-border" />
            <ChaptersPopover
              bookId={bookId}
              chapters={chapters}
              currentChapterId={currentChapter.id}
            />
            <h1 className="text-lg font-semibold text-foreground">
              {bookTitle}
            </h1>
            <span className="ml-2 text-sm text-muted-foreground/80">
              — Chapter {currentChapter.number}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
