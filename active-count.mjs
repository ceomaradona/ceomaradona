// active-count.mjs
import { supabase } from './supabase.mjs';

const { count, error } = await supabase
  .from('current_subscription_active')
  .select('id', { count: 'exact', head: true });

if (error) console.error('Erro:', error);
else console.log('Quantidade de ativas:', count);
