"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { setTheme, theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after client-side hydration
  useEffect(() => {
    setMounted(true)
    console.log('ThemeToggle mounted, theme:', theme, 'resolvedTheme:', resolvedTheme, 'systemTheme:', systemTheme)
  }, [theme, resolvedTheme, systemTheme])

  // Handle theme toggle - next-themes handles persistence automatically
  const handleToggle = () => {
    try {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark"
      console.log('Toggling theme from', resolvedTheme, 'to', newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
        disabled
      >
        <Moon className="h-4 w-4" />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"
  
  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent transition-colors"
      onClick={handleToggle}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
