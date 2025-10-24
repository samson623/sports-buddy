import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function updateUserToPro() {
  try {
    console.log('🔍 Fetching all users...\n')

    // Fetch all user profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, display_name, tier')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No users found in the database.')
      return
    }

    // Fetch emails from auth.users for each profile
    const profilesWithEmail = await Promise.all(
      profiles.map(async (profile) => {
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
        return {
          ...profile,
          email: userData.user?.email || 'N/A'
        }
      })
    )

    console.log(`Found ${profilesWithEmail.length} user(s):\n`)
    profilesWithEmail.forEach((profile, index) => {
      console.log(`${index + 1}. Email: ${profile.email}`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   Name: ${profile.display_name || 'N/A'}`)
      console.log(`   Current Tier: ${profile.tier || 'free'}`)
      console.log('')
    })

    // Prompt for user selection
    const selection = await promptUser('Enter the number of the user to upgrade to PRO (or "all" for all users): ')

    let userIds: string[] = []

    if (selection.toLowerCase() === 'all') {
      userIds = profilesWithEmail.map(p => p.id)
      console.log(`\n✅ Upgrading ALL ${userIds.length} user(s) to PRO tier...`)
    } else {
      const index = parseInt(selection) - 1
      if (index >= 0 && index < profilesWithEmail.length) {
        userIds = [profilesWithEmail[index].id]
        console.log(`\n✅ Upgrading user "${profilesWithEmail[index].email}" to PRO tier...`)
      } else {
        console.error('❌ Invalid selection')
        return
      }
    }

    // Update user(s) to pro tier
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('user_profiles')
      .update({ tier: 'pro' })
      .in('id', userIds)
      .select()

    if (updateError) {
      console.error('❌ Error updating user(s):', updateError)
      return
    }

    console.log(`\n✅ Successfully upgraded ${updatedProfiles?.length || 0} user(s) to PRO tier!`)
    
    if (updatedProfiles) {
      console.log('\nUpdated users:')
      for (const profile of updatedProfiles) {
        const userEmail = profilesWithEmail.find(p => p.id === profile.id)?.email || profile.id
        console.log(`  - ${userEmail}: ${profile.tier}`)
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateUserToPro()
