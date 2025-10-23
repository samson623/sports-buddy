"use client"

import { useEffect, useState } from 'react'

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export function useBreakpoint() {
  const [width, setWidth] = useState<number>(typeof window === 'undefined' ? 0 : window.innerWidth)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return {
    width,
    isSm: width >= breakpoints.sm,
    isMd: width >= breakpoints.md,
    isLg: width >= breakpoints.lg,
    isXl: width >= breakpoints.xl,
  }
}

export function useIsMobile() {
  const { width } = useBreakpoint()
  return width < breakpoints.md
}

export function useIsDesktop() {
  const { width } = useBreakpoint()
  return width >= breakpoints.lg
}
