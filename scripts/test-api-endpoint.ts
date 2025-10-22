import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local")
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEndpoint() {
  console.log("🧪 Testing AI Pre-Game Analysis API\n")

  try {
    // Step 1: Get first game
    console.log("📋 Step 1: Fetching game from database...")
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, home_team_id, away_team_id, week, season")
      .limit(1)

    if (gamesError || !games || games.length === 0) {
      console.error("❌ No games found")
      console.log("   Run: npm run seed")
      process.exit(1)
    }

    const game = games[0]
    console.log(`✅ Found game: ${game.id}`)
    console.log(`   Week ${game.week}, Season ${game.season}`)

    // Step 2: Get team info
    console.log("\n📋 Step 2: Fetching team info...")
    const { data: homeTeam } = await supabase
      .from("teams")
      .select("abbreviation")
      .eq("id", game.home_team_id)
      .single()

    const { data: awayTeam } = await supabase
      .from("teams")
      .select("abbreviation")
      .eq("id", game.away_team_id)
      .single()

    console.log(`✅ Matchup: ${awayTeam?.abbreviation} @ ${homeTeam?.abbreviation}`)

    // Step 3: Get injury data
    console.log("\n📋 Step 3: Checking injuries...")
    const { data: injuries } = await supabase
      .from("injuries")
      .select("id")
      .eq("game_id", game.id)
      .limit(5)

    console.log(`✅ Found ${injuries?.length || 0} injuries`)

    // Step 4: Get odds data
    console.log("\n📋 Step 4: Checking odds...")
    const { data: odds } = await supabase
      .from("odds")
      .select("spread, moneyline_home, total")
      .eq("game_id", game.id)
      .limit(1)

    if (odds && odds.length > 0) {
      console.log(`✅ Spread: ${odds[0].spread}`)
      console.log(`   Moneyline: ${odds[0].moneyline_home}`)
      console.log(`   Total: ${odds[0].total}`)
    } else {
      console.log("✅ No odds data (optional)")
    }

    // Step 5: Display API test instructions
    console.log("\n" + "=".repeat(60))
    console.log("📊 API ENDPOINT TEST")
    console.log("=".repeat(60))

    console.log("\n🔧 To test the endpoint:\n")
    console.log("1️⃣  Start the dev server (if not running):")
    console.log("   npm run dev\n")

    console.log("2️⃣  Open the app at http://localhost:3000")
    console.log("   Sign in with your account\n")

    console.log("3️⃣  Navigate to game detail page:")
    console.log(`   http://localhost:3000/games/${game.id}\n`)

    console.log("4️⃣  You should see:")
    console.log(`   ✓ Matchup: ${awayTeam?.abbreviation} @ ${homeTeam?.abbreviation}`)
    console.log(`   ✓ Week ${game.week}, Season ${game.season}`)
    console.log(`   ✓ Injuries: ${injuries?.length || 0}`)
    if (odds && odds.length > 0) {
      console.log(`   ✓ Betting lines`)
    }
    console.log(`   ✓ AI Analysis section (tier-gated)\n`)

    console.log("5️⃣  If Plus/Pro tier: Click 'Generate Analysis Now'")
    console.log("   If Free tier: Click 'View Plans' to upgrade\n")

    // Step 6: Direct API test
    console.log("📋 Step 6: Direct API Test (via curl)\n")

    console.log("Option A - With Authentication Token:")
    console.log("─".repeat(50))
    console.log("1. Get token from browser localStorage:")
    console.log("   Open DevTools → Application → localStorage")
    console.log("   Find: sb-znildkucbbehfydowzvr-auth-token\n")

    console.log("2. Test endpoint:")
    console.log(`   curl -X POST http://localhost:3000/api/generate-analysis \\`)
    console.log(`     -H "Content-Type: application/json" \\`)
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN" \\`)
    console.log(`     -d '{"gameId": "${game.id}"}'\n`)

    console.log("Option B - Expected Responses:")
    console.log("─".repeat(50))
    console.log("Free User:")
    console.log('  { "error": "Upgrade to Plus or Pro for AI analysis" }  [403]\n')

    console.log("Plus User (first generation):")
    console.log('  { "analysis": "markdown text...", "cached": false }  [200]\n')

    console.log("Plus User (cached):")
    console.log('  { "analysis": "markdown text...", "cached": true }  [200]\n')

    console.log("Pro User:")
    console.log('  { "analysis": "markdown text...", "cached": false }  [200]\n')

    // Step 7: Verify database state
    console.log("📋 Step 7: Database State Verification\n")

    const { data: analysisCount } = await supabase
      .from("ai_analyses")
      .select("id", { count: "exact" })

    console.log(`✅ AI Analyses in database: ${analysisCount?.length || 0}`)
    console.log(`✅ Available for game: ${game.id}`)

    // Summary
    console.log("\n" + "=".repeat(60))
    console.log("✨ TEST SETUP COMPLETE")
    console.log("=".repeat(60))

    console.log("\n📌 Next Steps:")
    console.log("1. Complete Supabase dashboard setup:")
    console.log("   □ Deploy Edge Function")
    console.log("   □ Set OpenAI API key")
    console.log("   □ Configure Cron Job")
    console.log("")
    console.log("2. Test locally:")
    console.log("   □ Start dev server: npm run dev")
    console.log("   □ Navigate to game detail page")
    console.log("   □ Try generating analysis")
    console.log("")
    console.log("3. Verify functionality:")
    console.log("   □ AI analysis displays correctly")
    console.log("   □ Tier gating works (Free/Plus/Pro)")
    console.log("   □ Analysis is cached on repeat requests")
    console.log("")
    console.log("📖 Full documentation: FEATURES.md")
    console.log("=" + "=".repeat(59))
  } catch (error) {
    console.error("❌ Test error:", error)
    process.exit(1)
  }
}

testEndpoint()
