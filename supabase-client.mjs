// supabase-client.mjs
import { createClient } from '@supabase/supabase-js'

// >>> SEUS DADOS (já confirmados)
const SUPABASE_URL = 'https://mkwrazuacnialsnmbwok.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rd3JhenVhY25pYWxzbm1id29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDU4ODksImV4cCI6MjA3MjU4MTg4OX0.hDLRjQScxMc7Q6kOZfv6Vu9eGsVBJdw5zWy4gdL-tnA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
