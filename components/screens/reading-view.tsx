'use client'

import { useState, useRef, useEffect } from 'react'
import { type HighlightColor } from '@/components/ui/highlighter-toolbar'
import { ReadingHeader } from '@/components/ui/reading-header'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { mockBook, getChapterByNumber, getNextChapter, getPreviousChapter } from '@/lib/utils/mock-book-data'
import { ChapterNavigationBar } from '@/components/reading/chapter-navigation-bar'
import { ReadingContent } from '@/components/reading/reading-content'
import { LearningSidebar } from '@/components/reading/learning-sidebar'
import { useTextSelection } from '@/hooks/use-text-selection'
import { BottomNavigation } from '../reading/bottom-navigation'
import { useSidebarStorage } from '@/hooks/use-sidebar-storage'

export function ReadingView({ bookId, chapterId }: { bookId: string; chapterId: string }) {
  const chapterNumber = parseInt(chapterId, 10)
  const currentChapter = getChapterByNumber(chapterNumber)
  const nextChapter = currentChapter ? getNextChapter(currentChapter.id) : undefined
  const previousChapter = currentChapter ? getPreviousChapter(currentChapter.id) : undefined

  const [selectedColor] = useState<HighlightColor>('yellow')
  const { state, isLoaded, updateIsOpen, updateWidth, updateActiveTab } = useSidebarStorage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const sidebarPanelRef = useRef<any>(null)
  const hasInitialized = useRef(false)

  const { selectedText, showPopover, popoverPosition, clearSelection } = useTextSelection()

  // Sync sidebar state with localStorage once loaded
  useEffect(() => {
    if (isLoaded && sidebarPanelRef.current && !hasInitialized.current) {
      hasInitialized.current = true
      setIsSidebarOpen(state.isOpen)

      // Use setTimeout to ensure the panel is ready
      setTimeout(() => {
        if (sidebarPanelRef.current) {
          if (state.isOpen) {
            sidebarPanelRef.current.expand()
          } else {
            sidebarPanelRef.current.collapse()
          }
        }
      }, 0)
    }
  }, [isLoaded, state.isOpen])

  if (!currentChapter) {
    return <div className="flex min-h-screen items-center justify-center">Chapter not found</div>
  }

  const handleAction = (action: string) => {
    console.log(`Action: ${action} on text: "${selectedText}"`)

    if (action === 'highlight') {
      console.log(`Highlighting with color: ${selectedColor}`)
    }

    clearSelection()
  }

  const handleSidebarToggle = () => {
    if (sidebarPanelRef.current) {
      if (isSidebarOpen) {
        sidebarPanelRef.current.collapse()
      } else {
        sidebarPanelRef.current.expand()
      }
    }
  }

  const handleSidebarCollapse = () => {
    setIsSidebarOpen(false)
    updateIsOpen(false)
  }

  const handleSidebarExpand = () => {
    setIsSidebarOpen(true)
    updateIsOpen(true)
  }

  const handleTabChange = (value: string) => {
    updateActiveTab(value)
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50 overflow-hidden">
      <ReadingHeader />

      <ChapterNavigationBar
        bookId={bookId}
        bookTitle={mockBook.title}
        chapters={mockBook.chapters}
        currentChapter={currentChapter}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <ResizablePanel defaultSize={65} minSize={50} className="overflow-hidden">
          <ReadingContent
            chapter={currentChapter}
            showPopover={showPopover}
            popoverPosition={popoverPosition}
            selectedColor={selectedColor}
            onAction={handleAction}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          ref={sidebarPanelRef}
          defaultSize={5}
          minSize={25}
          maxSize={40}
          collapsible={true}
          collapsedSize={5}
          onCollapse={handleSidebarCollapse}
          onExpand={handleSidebarExpand}
          onResize={(size) => updateWidth(size)}
          className="overflow-hidden"
        >
          <LearningSidebar
            isOpen={isSidebarOpen}
            onToggle={handleSidebarToggle}
            activeTab={state.activeTab}
            onTabChange={handleTabChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <BottomNavigation
        bookId={bookId}
        currentChapter={currentChapter}
        nextChapter={nextChapter}
        previousChapter={previousChapter}
      />
    </div>
  )
}
