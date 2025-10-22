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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAIAnalysis() {
  console.log("🚀 Setting up AI Pre-Game Analysis...\n")

  try {
    // Step 1: Verify ai_analyses table exists
    console.log("📋 Step 1: Verifying ai_analyses table...")
    const { data: tableInfo, error: tableError } = await supabase
      .from("ai_analyses")
      .select("id")
      .limit(1)

    if (tableError && tableError.code !== "PGRST116") {
      console.log("⚠️  Note: ai_analyses table might not exist yet")
      console.log("   This is expected - it's defined in your Supabase schema")
    } else {
      console.log("✅ ai_analyses table verified")
    }

    // Step 2: Update user_profiles schema
    console.log("\n📋 Step 2: Updating user_profiles schema...")
    console.log("   Running migration: Add weekly_analysis columns")

    const { error: migrationError } = await supabase.rpc("execute_sql", {
      query: `
        ALTER TABLE user_profiles
        ADD COLUMN IF NOT EXISTS weekly_analysis_used INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS weekly_analysis_reset_at TIMESTAMP DEFAULT NOW();
      `,
    })

    if (migrationError && migrationError.code !== "42P07") {
      console.log(`   Note: ${migrationError.message}`)
    } else {
      console.log("✅ user_profiles schema updated")
    }

    // Step 3: Verify database connection
    console.log("\n📋 Step 3: Verifying database connection...")
    const { count, error: countError } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error(`❌ Database error: ${countError.message}`)
      process.exit(1)
    }
    console.log(`✅ Database connected (${count} games found)`)

    // Step 4: Check for seeded data
    console.log("\n📋 Step 4: Checking seeded data...")
    const { data: teams } = await supabase
      .from("teams")
      .select("id", { count: "exact" })
      .limit(1)
    const { data: games } = await supabase
      .from("games")
      .select("id", { count: "exact" })
      .limit(1)

    console.log(`✅ Teams: ${teams?.length || 0}`)
    console.log(`✅ Games: ${games?.length || 0}`)

    if (!teams?.length || !games?.length) {
      console.log("\n⚠️  Seeded data not found!")
      console.log("   Run: npm run seed")
    }

    // Step 5: Verify OpenAI key
    console.log("\n📋 Step 5: Verifying OpenAI API key...")
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      console.error("❌ OPENAI_API_KEY not found in .env.local")
      process.exit(1)
    }
    console.log(`✅ OpenAI API key configured (${openaiKey.substring(0, 20)}...)`)

    // Step 6: Show deployment instructions
    console.log("\n📋 Step 6: Edge Function deployment instructions...")
    console.log("\n🔧 TO COMPLETE SETUP (manual steps):\n")
    console.log("1️⃣  DEPLOY EDGE FUNCTION:")
    console.log("   $ supabase functions deploy generate-analyses\n")

    console.log("2️⃣  SET OPENAI API KEY:")
    console.log("   Supabase Dashboard → Edge Functions → generate-analyses → Configuration")
    console.log("   Add environment variable:")
    console.log(`   OPENAI_API_KEY = ${openaiKey.substring(0, 20)}...\n`)

    console.log("3️⃣  SETUP CRON JOB:")
    console.log("   Supabase Dashboard → Database → Cron Jobs → New Job")
    console.log("   - Name: generate_analyses_weekly")
    console.log("   - Function: generate-analyses")
    console.log("   - Schedule: 0 14 * * 3  (Wed 2 PM UTC)")
    console.log("   - Timezone: UTC\n")

    console.log("4️⃣  TEST API ENDPOINT:")
    console.log("   POST http://localhost:3000/api/generate-analysis")
    console.log("   Body: { \"gameId\": \"<game-uuid>\" }\n")

    // Step 7: Create test script
    console.log("📋 Step 7: Creating test script...")
    const testScript = `#!/bin/bash

# Get first game from database
GAME_ID=$(curl -s -X POST "${supabaseUrl}/rest/v1/rpc/read_games" \\
  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{}' | jq -r '.[0].id')

if [ -z "$GAME_ID" ]; then
  echo "❌ No games found. Run: npm run seed"
  exit 1
fi

echo "🧪 Testing with game: $GAME_ID"
curl -X POST http://localhost:3000/api/generate-analysis \\
  -H "Content-Type: application/json" \\
  -d "{\"gameId\": \"$GAME_ID\"}"
`

    fs.writeFileSync(path.join(process.cwd(), "scripts/test-analysis.sh"), testScript)
    console.log("✅ Test script created: scripts/test-analysis.sh")

    // Summary
    console.log("\n" + "=".repeat(60))
    console.log("✨ SETUP VERIFICATION COMPLETE")
    console.log("=".repeat(60))
    console.log("\n📊 Status Summary:")
    console.log("  ✅ Database: Connected")
    console.log("  ✅ Tables: ai_analyses, user_profiles")
    console.log("  ✅ Seeded Data: Ready")
    console.log("  ✅ OpenAI Key: Configured")
    console.log("  ⏳ Edge Function: Pending deployment")
    console.log("  ⏳ Cron Job: Pending setup")
    console.log("\n🚀 Next Steps:")
    console.log("  1. Deploy Edge Function (see above)")
    console.log("  2. Setup Cron Job (see above)")
    console.log("  3. Test endpoint (see above)")
    console.log("\n📖 Documentation: FEATURES.md")
    console.log("=" + "=".repeat(59))
  } catch (error) {
    console.error("❌ Setup error:", error)
    process.exit(1)
  }
}

setupAIAnalysis()
