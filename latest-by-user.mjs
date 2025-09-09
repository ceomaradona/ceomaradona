// latest-by-user.mjs
import { supabase } from './supabase.mjs';

const USER_ID = '6790b75c-80f9-4134-9220-e9e634a60ed9'; // ajuste se quiser

const { data, error } = await supabase
  .from('current_subscriptions')
  .select('id,user_id,plan,status,price,start_date,end_date,created_at')
  .eq('user_id', USER_ID)
  .order('created_at', { ascending: false })
  .limit(1);

if (error) console.error('Erro:', error);
else console.log('Última assinatura do usuário:', data?.[0] ?? null);
