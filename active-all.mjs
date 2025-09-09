// active-all.mjs
import { supabase } from './supabase.mjs';

const { data, error } = await supabase
  .from('current_subscription_active')
  .select('id,user_id,plan,status,price,start_date,end_date,created_at')
  .order('created_at', { ascending: false });

if (error) console.error('Erro:', error);
else console.log('Ativas (todas):', data);
