export default function Footer() {
  return (
    <footer className="border-t mt-8 py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex gap-4">
          <a href="/legal/terms" className="hover:text-foreground transition-colors">Terms</a>
          <a href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="/support" className="hover:text-foreground transition-colors">Support</a>
        </div>
        <p className="opacity-70">© {new Date().getFullYear()} Sports Buddy. All rights reserved.</p>
      </div>
    </footer>
  )
}
