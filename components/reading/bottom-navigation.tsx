import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Chapter } from '@/lib/utils/mock-book-data'

interface BottomNavigationProps {
  bookId: string
  currentChapter: Chapter
  previousChapter?: Chapter
  nextChapter?: Chapter
}

export function BottomNavigation({
  bookId,
  currentChapter,
  previousChapter,
  nextChapter,
}: BottomNavigationProps) {
  return (
    <div className="border-t bg-white">
      <div className="px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Chapter */}
          <div className="flex-1">
            {previousChapter && (
              <Link
                href={`/book/${bookId}/chapter/${previousChapter.number}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-0.5" />
                <div className="text-left">
                  <p className="text-xs text-primary/80">Previous chapter</p>
                  <p className="font-medium">{previousChapter.title}</p>
                </div>
              </Link>
            )}
          </div>

          {/* Current Chapter */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="font-normal">
              Chapter {currentChapter.number}
            </Badge>
            <p className="text-sm font-bold text-neutral-900">
              {currentChapter.title}
            </p>
          </div>

          {/* Next Chapter */}
          <div className="flex-1 flex justify-end">
            {nextChapter && (
              <Link
                href={`/book/${bookId}/chapter/${nextChapter.number}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors group"
              >
                <div className="text-right">
                  <p className="text-xs text-primary/80">Next chapter</p>
                  <p className="font-medium">{nextChapter.title}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
