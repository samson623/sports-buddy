import Link from "next/link"
import { User } from "lucide-react"

export function Sidebar() {
  return (
    <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-background border-r">
      <div className="flex h-16 items-center border-b px-4 font-semibold text-foreground">Sports Buddy</div>
      <nav className="p-4 space-y-2">
        <Link href="/" className="block rounded px-3 py-2 text-foreground hover:bg-secondary transition-colors">Home</Link>
        <Link href="/dashboard" className="block rounded px-3 py-2 text-foreground hover:bg-secondary transition-colors">Schedule</Link>
        <Link href="/teams" className="block rounded px-3 py-2 text-foreground hover:bg-secondary transition-colors">Teams</Link>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>Account</span>
      </div>
    </aside>
  )
}

export default Sidebar
