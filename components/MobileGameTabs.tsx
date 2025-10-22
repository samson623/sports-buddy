"use client"

import { useState, useMemo } from "react"
import { useSwipeable } from "react-swipeable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  overview: React.ReactNode
  rosters: React.ReactNode
  injuries: React.ReactNode
  odds: React.ReactNode
}

const order = ["overview", "rosters", "injuries", "odds"] as const
type TabKey = typeof order[number]
function isTabKey(v: string): v is TabKey {
  return (order as readonly string[]).includes(v)
}

export default function MobileGameTabs({ overview, rosters, injuries, odds }: Props) {
  const [tab, setTab] = useState<TabKey>("overview")

  const idx = useMemo(() => order.indexOf(tab), [tab])
  const handlers = useSwipeable({
    onSwipedLeft: () => setTab(order[Math.min(order.length - 1, idx + 1)]),
    onSwipedRight: () => setTab(order[Math.max(0, idx - 1)]),
    trackMouse: true,
  })

  return (
    <div {...handlers}>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (isTabKey(v)) setTab(v)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">
            Overview
          </TabsTrigger>
          <TabsTrigger value="rosters" className="flex-1">
            Rosters
          </TabsTrigger>
          <TabsTrigger value="injuries" className="flex-1">
            Injuries
          </TabsTrigger>
          <TabsTrigger value="odds" className="flex-1">
            Odds
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">{overview}</TabsContent>
        <TabsContent value="rosters">{rosters}</TabsContent>
        <TabsContent value="injuries">{injuries}</TabsContent>
        <TabsContent value="odds">{odds}</TabsContent>
      </Tabs>
    </div>
  )
}
