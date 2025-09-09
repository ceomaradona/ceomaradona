// queries.mjs
import { supabase } from './supabase-client.mjs'

// Ajuste o NOME da view/tabela conforme você já usou. Aqui uso "current_subscription_active".
const VIEW = 'current_subscription_active'

// 1) Ativas por usuário específico
export async function getActiveByUser(userId) {
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data
}

// 2) Todas as ativas
export async function getAllActive() {
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')

  if (error) throw error
  return data
}

// 3) Contagem de ativas
export async function getActiveCount() {
  const { count, error } = await supabase
    .from(VIEW)
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

// 4) Histórico de um usuário (exemplo simples: ordena pela created_at desc)
export async function getHistoryByUser(userId) {
  const { data, error } = await supabase
    .from('current_subscriptions') // Se você já tem uma view/tabela de histórico, use o nome certo aqui
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
