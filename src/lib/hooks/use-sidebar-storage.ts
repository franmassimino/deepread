import { useState, useEffect } from 'react'

const STORAGE_KEY = 'deepread-sidebar-state'

interface SidebarState {
  isOpen: boolean
  width: number
  activeTab: string
}

const defaultState: SidebarState = {
  isOpen: false,
  width: 35,
  activeTab: 'notes',
}

export function useSidebarStorage() {
  const [state, setState] = useState<SidebarState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState(parsed)
      } catch (error) {
        console.error('Error parsing sidebar state:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isLoaded])

  const updateIsOpen = (isOpen: boolean) => {
    setState((prev) => ({ ...prev, isOpen }))
  }

  const updateWidth = (width: number) => {
    setState((prev) => ({ ...prev, width }))
  }

  const updateActiveTab = (activeTab: string) => {
    setState((prev) => ({ ...prev, activeTab }))
  }

  return {
    state,
    isLoaded,
    updateIsOpen,
    updateWidth,
    updateActiveTab,
  }
}
