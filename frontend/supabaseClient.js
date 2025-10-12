import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gqbhxdhhbmdiygejirgq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYmh4ZGhoYm1kaXlnZWppcmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDg5MDgsImV4cCI6MjA2NzYyNDkwOH0.JJpnbZmO5ioPP4F6akpTzjrmW-hCYXnK0b-4LIYsNYw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)