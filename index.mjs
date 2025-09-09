// index.mjs

// 1) Força o Node a preferir IPv4
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

// 2) Fetch estável no Node
import fetch from 'cross-fetch';
globalThis.fetch = fetch;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mkwrazuacnialsnmbwok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rd3JhenVhY25pYWxzbm1id29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDU4ODksImV4cCI6MjA3MjU4MTg4OX0.hDLRjQScxMc7Q6kOZfv6Vu9eGsVBJdw5zWy4gdL-tnA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  try {
    // ping rápido para validar HTTPS
    const head = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD' });
    console.log('HEAD /rest/v1 status:', head.status);

    // consulta real
    const { data, error } = await supabase
      .from('current_subscription_active')
      .select('id,user_id,plan,status,price,start_date,end_date,created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('OK (dados):', data);
  } catch (e) {
    console.error('Erro Supabase:', e);
  }
}

main();
