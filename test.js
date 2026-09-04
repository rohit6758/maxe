import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgveleeduexjklzojkcj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('resources').insert([{ subject_id: 1, title: 'test', url: 'test', type: 'chat' }]).select();
  console.log('chat:', error ? error.message : 'success');
  
  const { data: d2, error: e2 } = await supabase.from('resources').insert([{ subject_id: 1, title: 'test', url: 'test', type: 'ai' }]).select();
  console.log('ai:', e2 ? e2.message : 'success');
}

test();
