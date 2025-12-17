import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Modern browsers
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  // Avoid hydration mismatch by returning false on server
  if (!mounted) {
    return false
  }

  return matches
}
