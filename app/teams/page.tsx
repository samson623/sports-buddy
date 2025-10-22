export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, full_name, city, abbreviation, conference, division")
    .order("conference, division")

  if (error) {
    console.error("Error fetching teams:", error)
  }

  // Group teams by conference
  const teamsByConference = (teams || []).reduce(
    (acc: Record<string, Record<string, typeof teams>>, team) => {
      const conference = team.conference || 'Unassigned'
      const division = team.division || 'Unassigned'
      if (!acc[conference]) {
        acc[conference] = {}
      }
      if (!acc[conference][division]) {
        acc[conference][division] = []
      }
      acc[conference][division]?.push(team)
      return acc
    },
    {}
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NFL Teams</h1>

      {Object.entries(teamsByConference).map(([conference, divisions]) => (
        <div key={conference} className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{conference} Conference</h2>
          <div className="space-y-8">
            {Object.entries(divisions).map(([division, divisionTeams]) => (
              <div key={`${conference}-${division}`}>
                <h3 className="text-lg font-medium mb-4 text-muted-foreground">{division} Division</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(divisionTeams || []).map((team) => (
                    <div
                      key={team.id}
                      className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="font-mono text-sm text-muted-foreground mb-2">{team.abbreviation}</div>
                      <div className="font-semibold text-lg">{team.full_name}</div>
                      <div className="text-sm text-muted-foreground">{team.city}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!teams || teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No teams found. Please run the seed script first.</p>
        </div>
      )}
    </div>
  )
}
