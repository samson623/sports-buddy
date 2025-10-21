"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarDays, User } from "lucide-react"

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Schedule", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t h-16">
      <ul className="grid h-full grid-cols-3">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = pathname === t.href || pathname.startsWith(t.href + "/")
          return (
            <li key={t.href} className="flex items-center justify-center">
              <Link href={t.href} className="flex flex-col items-center gap-1 text-xs">
                <Icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-500"}`} />
                <span className={active ? "text-blue-600" : "text-gray-600"}>{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
