import { supabase } from '../supabaseClient'

type ProgressRow = {
  category_name: string
  progress_percent: number
  status: string
}

export async function getUserProfileProgress() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error("No user logged in")

  const { data, error } = await supabase
    .from('user_category_progress')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw error

  return {
    user_id: user.id,
    full_name: data[0]?.full_name,
    email: data[0]?.email,
    progress: (data as ProgressRow[]).map(d => ({
      category: d.category_name,
      progress_percent: d.progress_percent,
      status: d.status,
    })),
  }
}