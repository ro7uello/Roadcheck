// test-supabase.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const test = async () => {
  const { data, error } = await supabase.from('scenarios').select('*')
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Data:', data)
  }
}

test()
