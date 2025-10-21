export default function Footer() {
  return (
    <footer className="border-t mt-8 py-8 text-sm text-gray-600">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex gap-4">
          <a href="/legal/terms" className="hover:underline">Terms</a>
          <a href="/legal/privacy" className="hover:underline">Privacy</a>
          <a href="/support" className="hover:underline">Support</a>
        </div>
        <p className="opacity-70">© {new Date().getFullYear()} Sports Buddy. All rights reserved.</p>
      </div>
    </footer>
  )
}
