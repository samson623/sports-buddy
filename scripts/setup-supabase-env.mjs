import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { existsSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
const keys = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'e.g. https://xyzcompany.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Public anon key from Supabase project Settings → API',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Service role key (optional, required for server-side admin tasks)',
  },
]

function parseExistingValues() {
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const values = {}
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match) {
      // Strip surrounding quotes if present.
      const rawValue = match[2]?.trim() ?? ''
      values[match[1]] = rawValue.replace(/^"(.*)"$/, '$1')
    }
  }
  return values
}

async function promptForValues() {
  const existingValues = parseExistingValues()
  const rl = createInterface({ input: stdin, output: stdout })

  const responses = {}
  try {
    stdout.write(`Writing Supabase credentials to ${envPath}\n`)
    for (const { name, description } of keys) {
      const defaultValue = existingValues[name] ?? ''
      const hint = description ? ` (${description})` : ''
      const promptText = defaultValue
        ? `${name}${hint} [${defaultValue}]: `
        : `${name}${hint}: `
      const answer = (await rl.question(promptText)).trim()
      responses[name] = answer || defaultValue || ''
    }
  } finally {
    rl.close()
  }
  return responses
}

function formatEnvFile(values) {
  const header = '# Supabase configuration\n'
  const lines = keys.map(({ name }) => `${name}=${values[name] ?? ''}`)
  return `${header}${lines.join('\n')}\n`
}

async function main() {
  const values = await promptForValues()
  const content = formatEnvFile(values)
  await writeFile(envPath, content, { encoding: 'utf8' })
  stdout.write(`\nSaved Supabase env variables to ${envPath}\n`)
  stdout.write('Remember to keep service role keys private.\n')
}

main().catch((error) => {
  console.error('Failed to write Supabase env file:', error)
  process.exitCode = 1
})
