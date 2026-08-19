import { createClient } from '@supabase/supabase-js'

// Using the provided API keys (Note: in production these should be environment variables)
const supabaseUrl = 'https://dgveleeduexjklzojkcj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
