"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { setTheme, theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after client-side hydration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setMounted(true)
    console.log("[ThemeToggle] mounted", { theme, resolvedTheme, systemTheme })
  }, [])

  // Toggle via next-themes (handles storage + class application)
  // Use resolvedTheme ?? theme as fallback for robustness
  const toggleTheme = () => {
    const currentTheme = resolvedTheme ?? theme
    const nextTheme = currentTheme === "dark" ? "light" : "dark"
    console.log("[ThemeToggle] toggling", { from: currentTheme, to: nextTheme })
    setTheme(nextTheme)
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

  const isDark = (resolvedTheme ?? theme) === "dark"
  
  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent transition-colors"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
