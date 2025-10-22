import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Load .env.local file
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=")
      if (key && value) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Environment variables:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗")
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗")
  throw new Error("Missing Supabase credentials in environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 32 NFL Teams organized by conference and division
const nflTeams = [
  // AFC East
  { abbreviation: "BUF", full_name: "Buffalo Bills", city: "Buffalo", conference: "AFC", division: "East" },
  { abbreviation: "MIA", full_name: "Miami Dolphins", city: "Miami", conference: "AFC", division: "East" },
  { abbreviation: "NE", full_name: "New England Patriots", city: "Foxborough", conference: "AFC", division: "East" },
  { abbreviation: "NYJ", full_name: "New York Jets", city: "East Rutherford", conference: "AFC", division: "East" },
  // AFC North
  { abbreviation: "BAL", full_name: "Baltimore Ravens", city: "Baltimore", conference: "AFC", division: "North" },
  { abbreviation: "CIN", full_name: "Cincinnati Bengals", city: "Cincinnati", conference: "AFC", division: "North" },
  { abbreviation: "CLE", full_name: "Cleveland Browns", city: "Cleveland", conference: "AFC", division: "North" },
  { abbreviation: "PIT", full_name: "Pittsburgh Steelers", city: "Pittsburgh", conference: "AFC", division: "North" },
  // AFC South
  { abbreviation: "HOU", full_name: "Houston Texans", city: "Houston", conference: "AFC", division: "South" },
  { abbreviation: "IND", full_name: "Indianapolis Colts", city: "Indianapolis", conference: "AFC", division: "South" },
  { abbreviation: "JAX", full_name: "Jacksonville Jaguars", city: "Jacksonville", conference: "AFC", division: "South" },
  { abbreviation: "TEN", full_name: "Tennessee Titans", city: "Nashville", conference: "AFC", division: "South" },
  // AFC West
  { abbreviation: "DEN", full_name: "Denver Broncos", city: "Denver", conference: "AFC", division: "West" },
  { abbreviation: "KC", full_name: "Kansas City Chiefs", city: "Kansas City", conference: "AFC", division: "West" },
  { abbreviation: "LV", full_name: "Las Vegas Raiders", city: "Las Vegas", conference: "AFC", division: "West" },
  { abbreviation: "LAC", full_name: "Los Angeles Chargers", city: "Los Angeles", conference: "AFC", division: "West" },
  // NFC East
  { abbreviation: "DAL", full_name: "Dallas Cowboys", city: "Dallas", conference: "NFC", division: "East" },
  { abbreviation: "NYG", full_name: "New York Giants", city: "East Rutherford", conference: "NFC", division: "East" },
  { abbreviation: "PHI", full_name: "Philadelphia Eagles", city: "Philadelphia", conference: "NFC", division: "East" },
  { abbreviation: "WAS", full_name: "Washington Commanders", city: "Landover", conference: "NFC", division: "East" },
  // NFC North
  { abbreviation: "CHI", full_name: "Chicago Bears", city: "Chicago", conference: "NFC", division: "North" },
  { abbreviation: "DET", full_name: "Detroit Lions", city: "Detroit", conference: "NFC", division: "North" },
  { abbreviation: "GB", full_name: "Green Bay Packers", city: "Green Bay", conference: "NFC", division: "North" },
  { abbreviation: "MIN", full_name: "Minnesota Vikings", city: "Minneapolis", conference: "NFC", division: "North" },
  // NFC South
  { abbreviation: "ATL", full_name: "Atlanta Falcons", city: "Atlanta", conference: "NFC", division: "South" },
  { abbreviation: "CAR", full_name: "Carolina Panthers", city: "Charlotte", conference: "NFC", division: "South" },
  { abbreviation: "NO", full_name: "New Orleans Saints", city: "New Orleans", conference: "NFC", division: "South" },
  { abbreviation: "TB", full_name: "Tampa Bay Buccaneers", city: "Tampa", conference: "NFC", division: "South" },
  // NFC West
  { abbreviation: "ARI", full_name: "Arizona Cardinals", city: "Glendale", conference: "NFC", division: "West" },
  { abbreviation: "LAR", full_name: "Los Angeles Rams", city: "Los Angeles", conference: "NFC", division: "West" },
  { abbreviation: "SF", full_name: "San Francisco 49ers", city: "San Francisco", conference: "NFC", division: "West" },
  { abbreviation: "SEA", full_name: "Seattle Seahawks", city: "Seattle", conference: "NFC", division: "West" },
]

// Sample player names by position
const samplePlayers = {
  QB: ["Patrick Mahomes", "Josh Allen", "Jalen Hurts", "Lamar Jackson", "Joe Burrow"],
  RB: ["Christian McCaffrey", "Derrick Henry", "Jonathan Taylor", "Dalvin Cook", "Josh Jacobs"],
  WR: ["Travis Kelce", "CeeDee Lamb", "Stefon Diggs", "Justin Jefferson", "Tyreek Hill"],
  TE: ["George Kittle", "Mark Andrews", "Travis Kelce", "Darren Waller", "Kyle Pitts"],
  LT: ["Trent Williams", "Andrew Thomas", "David Bakhtiari", "Ronnie Stanley", "Tyron Smith"],
}

interface Player {
  team_id: string
  first_name: string
  last_name: string
  position: string
}

interface Game {
  season: number
  week: number
  home_team_id: string
  away_team_id: string
  kickoff_utc: string
  venue: string
  status: string
}

interface Odds {
  game_id: string
  bookmaker: string
  spread: number
  moneyline_home: number
  moneyline_away: number
  total: number
}

interface Injury {
  player_id: string
  injury_status: string
  body_part: string
  description: string
}

async function seed() {
  try {
    console.log("🌱 Starting data seed...")

    // Check if teams already exist
    console.log("\n📍 Checking for existing teams...")
    const { data: existingTeams, error: existingError } = await supabase
      .from("teams")
      .select("id, abbreviation")
      .limit(1)

    let teamsData: Array<{ id: string; abbreviation: string }>

    if (existingTeams && existingTeams.length > 0) {
      console.log("✓ Teams already exist, fetching all teams...")
      const { data: allTeams, error: allTeamsError } = await supabase
        .from("teams")
        .select("id, abbreviation")

      if (allTeamsError) throw new Error(`Failed to fetch teams: ${allTeamsError.message}`)
      teamsData = allTeams || []
      console.log(`✓ Found ${teamsData.length} existing teams`)
    } else {
      console.log("Inserting 32 NFL teams...")
      const { data: insertedTeams, error: teamsError } = await supabase
        .from("teams")
        .insert(nflTeams)
        .select("id, abbreviation")

      if (teamsError) throw new Error(`Failed to insert teams: ${teamsError.message}`)
      teamsData = insertedTeams || []
      console.log(`✓ Inserted ${teamsData.length} teams`)
    }

    // Create a map of abbreviation to team_id
    const teamMap: Record<string, string> = {}
    teamsData.forEach((team) => {
      teamMap[team.abbreviation] = team.id
    })

    // Insert Players
    console.log("\n👥 Inserting 5 sample players per team (160 total)...")
    const playersToInsert: Player[] = []

    teamsData.forEach((team) => {
      const positions = ["QB", "RB", "WR", "TE", "LT"] as const
      positions.forEach((position) => {
        const nameIndex = Math.floor(Math.random() * samplePlayers[position].length)
        const fullName = samplePlayers[position][nameIndex]
        const [firstName, lastName] = fullName.split(" ")

        playersToInsert.push({
          team_id: team.id,
          first_name: firstName,
          last_name: lastName,
          position: position,
        })
      })
    })

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .insert(playersToInsert)
      .select("id, team_id, position")

    if (playersError) throw new Error(`Failed to insert players: ${playersError.message}`)
    console.log(`✓ Inserted ${playersData.length} players`)

    // Create depth chart entries
    console.log("\n📊 Adding players to depth_chart with rank=1...")
    const depthChartEntries = playersData.map((player) => ({
      team_id: player.team_id,
      player_id: player.id,
      position: samplePlayers[Object.keys(samplePlayers)[Math.floor(Math.random() * 5)] as keyof typeof samplePlayers],
      rank: 1,
    }))

    const { data: depthData, error: depthError } = await supabase
      .from("depth_chart")
      .insert(depthChartEntries)
      .select()

    if (depthError) throw new Error(`Failed to insert depth_chart: ${depthError.message}`)
    console.log(`✓ Added ${depthData?.length || 0} entries to depth_chart`)

    // Insert Games
    console.log("\n🏈 Inserting 8 sample games for current week...")
    const gamesData: Game[] = []
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 1) // Tomorrow

    const gameMatchups = [
      ["KC", "BUF"],
      ["SF", "LAR"],
      ["DAL", "PHI"],
      ["GB", "DET"],
      ["BAL", "PIT"],
      ["NO", "TB"],
      ["DEN", "LAC"],
      ["NYG", "WAS"],
    ]

    gameMatchups.forEach((matchup, index) => {
      const kickoffTime = new Date(baseDate)
      kickoffTime.setHours(13 + index) // Stagger times

      gamesData.push({
        season: 2025,
        week: 1,
        away_team_id: teamMap[matchup[0]],
        home_team_id: teamMap[matchup[1]],
        kickoff_utc: kickoffTime.toISOString(),
        venue: `${matchup[1]} Stadium`,
        status: "scheduled",
      })
    })

    const { data: insertedGames, error: gamesError } = await supabase
      .from("games")
      .insert(gamesData)
      .select("id, away_team_id, home_team_id")

    if (gamesError) throw new Error(`Failed to insert games: ${gamesError.message}`)
    console.log(`✓ Inserted ${insertedGames.length} games`)

    // Insert Odds
    console.log("\n💰 Inserting sample odds for each game...")
    if (!insertedGames || insertedGames.length === 0) {
      throw new Error("No games were inserted to create odds for")
    }

    const oddsData: Odds[] = []

    insertedGames.forEach((game) => {
      oddsData.push({
        game_id: game.id,
        bookmaker: "DraftKings",
        spread: Number((Math.random() * 10 - 5).toFixed(1)),
        moneyline_home: Math.random() > 0.5 ? -110 : 110,
        moneyline_away: Math.random() > 0.5 ? -110 : 110,
        total: Number((40 + Math.random() * 30).toFixed(1)),
      })
    })

    const { data: oddsInserted, error: oddsError } = await supabase
      .from("odds")
      .insert(oddsData)
      .select()

    if (oddsError) throw new Error(`Failed to insert odds: ${oddsError.message}`)
    console.log(`✓ Inserted ${oddsInserted?.length || 0} odds records`)

    // Insert Injuries
    console.log("\n🤕 Inserting 5-10 sample injuries...")
    const injuryStatuses = ["out", "doubtful", "questionable", "probable"]
    const bodyParts = ["ankle", "knee", "shoulder", "elbow", "hamstring", "quad", "wrist", "ribs"]
    const injuriesData: Injury[] = []

    const injuryCount = Math.floor(Math.random() * 6) + 5 // 5-10 injuries
    for (let i = 0; i < injuryCount; i++) {
      const randomPlayer = playersData[Math.floor(Math.random() * playersData.length)]
      const randomStatus = injuryStatuses[Math.floor(Math.random() * injuryStatuses.length)]
      const randomBodyPart = bodyParts[Math.floor(Math.random() * bodyParts.length)]

      injuriesData.push({
        player_id: randomPlayer.id,
        injury_status: randomStatus,
        body_part: randomBodyPart,
        description: `${randomStatus.charAt(0).toUpperCase() + randomStatus.slice(1)} with ${randomBodyPart} injury`,
      })
    }

    const { data: injuriesInserted, error: injuriesError } = await supabase
      .from("injuries")
      .insert(injuriesData)
      .select()

    if (injuriesError) throw new Error(`Failed to insert injuries: ${injuriesError.message}`)
    console.log(`✓ Inserted ${injuriesInserted?.length || 0} injury records`)

    console.log("\n✅ Seed completed successfully!")
    console.log(`\n📊 Summary:`)
    console.log(`   • Teams: ${teamsData.length}`)
    console.log(`   • Players: ${playersData.length}`)
    console.log(`   • Depth Chart Entries: ${depthData.length}`)
    console.log(`   • Games: ${insertedGames.length}`)
    console.log(`   • Odds: ${oddsInserted.length}`)
    console.log(`   • Injuries: ${injuriesInserted.length}`)
  } catch (error) {
    console.error("❌ Seed failed:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

seed()
