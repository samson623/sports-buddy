"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

export function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold">Sports Buddy</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700">
            <Link href="/dashboard" className="hover:text-black">Schedule</Link>
            <Link href="/teams" className="hover:text-black">Teams</Link>
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
          </nav>
        </div>
        <div className="hidden lg:flex items-center">
          <Link href="/profile" className="text-sm">Account</Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t">
          <div className="px-4 py-2 flex flex-col">
            <Link href="/dashboard" className="py-2">Schedule</Link>
            <Link href="/teams" className="py-2">Teams</Link>
            <Link href="/pricing" className="py-2">Pricing</Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
