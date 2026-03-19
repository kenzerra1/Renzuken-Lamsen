import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sezyewvxllysfkfnapkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlenlld3Z4bGx5c2ZrZm5hcGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTIzNzAsImV4cCI6MjA4OTM4ODM3MH0.Sh9xaEA0m9vNNu3E11j1TKnMr3lDUbsDkeqNxZoPAMs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
