// Usage: node --env-file=.env.local scripts/seed.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run with: node --env-file=.env.local scripts/seed.mjs'
  )
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const products = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'products.json'), 'utf-8')
)

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

const { data, error } = await supabase.from('products').insert(products).select()

if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`Seeded ${data.length} products successfully.`)
