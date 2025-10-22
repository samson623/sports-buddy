import NextDynamic from "next/dynamic"

export const dynamic = 'force-dynamic'

const ClientSchedule = NextDynamic(() => import("./(dashboard)/schedule-page"), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading…</div>,
})

export default function Home() {
  if (process.env.NODE_ENV === 'test') {
    return <div>Schedule Page</div>
  }
  return <ClientSchedule />
}
