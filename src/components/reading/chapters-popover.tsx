'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { List } from 'lucide-react'
import Link from 'next/link'
import type { Chapter } from '@/lib/utils/mock-book-data'

interface ChaptersPopoverProps {
  bookId: string
  chapters: Chapter[]
  currentChapterId: string
}

export function ChaptersPopover({
  bookId,
  chapters,
  currentChapterId,
}: ChaptersPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-600 hover:text-neutral-900 px-2 mr-2 cursor-pointer"
          aria-label="Open table of contents"
        >
          <List className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-4">
          <h3 className="font-semibold text-sm text-neutral-900">Chapters</h3>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {chapters.map((chapter) => {
              const isCurrent = chapter.id === currentChapterId
              return (
                <Link
                  key={chapter.id}
                  href={`/book/${bookId}/chapter/${chapter.number}`}
                  className={`
                    block rounded-md px-3 py-2 text-sm transition-colors
                    hover:bg-neutral-50
                    ${
                      isCurrent
                        ? 'bg-neutral-100 font-medium text-neutral-900'
                        : 'text-neutral-700'
                    }
                  `}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className="text-neutral-500">
                    {chapter.number}.
                  </span>{' '}
                  {chapter.title}
                </Link>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
