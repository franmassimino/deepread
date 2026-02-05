'use client'

import { useState, useEffect, useRef } from 'react'

interface TextSelectionState {
  selectedText: string
  showPopover: boolean
  popoverPosition: { x: number; y: number }
}

interface UseTextSelectionOptions {
  containerId?: string
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { containerId = 'reading-content' } = options
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<TextSelectionState>({
    selectedText: '',
    showPopover: false,
    popoverPosition: { x: 0, y: 0 },
  })

  useEffect(() => {
    const handleSelectionChange = () => {
      // Clear any existing timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }

      // Debounce the selection change to avoid excessive updates
      selectionTimeoutRef.current = setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()

        if (text && text.length > 0) {
          const range = selection?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()

          // Check if the selection is within the reading content area
          const commonAncestor = range?.commonAncestorContainer
          const readingContent = document.getElementById(containerId)

          const isWithinReadingArea = commonAncestor && readingContent?.contains(
            commonAncestor.nodeType === Node.TEXT_NODE
              ? commonAncestor.parentNode
              : commonAncestor
          )

          if (rect && isWithinReadingArea) {
            // Smart positioning with boundary detection
            const POPOVER_WIDTH = 600 // Approximate width of popover
            const PADDING = 20 // Padding from screen edges

            const minX = POPOVER_WIDTH / 2 + PADDING
            const maxX = window.innerWidth - POPOVER_WIDTH / 2 - PADDING

            const centeredX = rect.left + rect.width / 2
            const boundedX = Math.max(minX, Math.min(maxX, centeredX))

            setState({
              selectedText: text,
              showPopover: true,
              popoverPosition: {
                x: boundedX,
                y: rect.top + window.scrollY,
              },
            })
          } else {
            setState(prev => ({ ...prev, showPopover: false }))
          }
        } else {
          setState(prev => ({ ...prev, showPopover: false }))
        }
      }, 100)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [containerId])

  const clearSelection = () => {
    setState({
      selectedText: '',
      showPopover: false,
      popoverPosition: { x: 0, y: 0 },
    })
    window.getSelection()?.removeAllRanges()
  }

  return {
    ...state,
    clearSelection,
  }
}
