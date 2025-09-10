// server.mjs — API com Supabase (coluna user_id corrigida)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ---- Variáveis de ambiente ----
const { SUPABASE_URL, SUPABASE_KEY } = process.env;
const PORT = Number(process.env.PORT ?? 8080);
const HOST = '0.0.0.0';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

// ---- Supabase ----
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- App Express ----
const app = express();
app.use(cors());
app.use(express.json());

// ---- Rotas básicas ----
// Healthcheck simples (texto)
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));

// Página raiz (JSON)
app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// ---- Helpers comuns ----
function getUserId(req) {
  // aceita ?user_id=... ou header x-user-id
  return (req.query.user_id || req.get('x-user-id') || '').toString().trim();
}

function mapSupabaseError(error) {
  return error?.message || 'Erro desconhecido';
}

// ---- Rotas de subscriptions ----

// 1) Histórico completo do usuário
// GET /subscriptions/history?user_id=UUID
app.get('/subscriptions/history', async (req, res) => {
  const user_id = getUserId(req);
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Informe user_id' });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ status: 'error', message: mapSupabaseError(error) });
  return res.json({ status: 'ok', data });
});

// 2) Última assinatura do usuário
// GET /subscriptions/latest?user_id=UUID
app.get('/subscriptions/latest', async (req, res) => {
  const user_id = getUserId(req);
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Informe user_id' });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ status: 'error', message: mapSupabaseError(error) });
  return res.json({ status: 'ok', data });
});

// 3) Contagem de assinaturas ativas (geral)
// GET /subscriptions/count/active
app.get('/subscriptions/count/active', async (_req, res) => {
  // Considera status 'ativo' (pt) e 'active' (en)
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['ativo', 'active']);

  if (error) return res.status(500).json({ status: 'error', message: mapSupabaseError(error) });
  return res.json({ status: 'ok', count: data === null ? 0 : data.length ?? 0 });
});

// 4) Assinaturas ativas por usuário
// GET /subscriptions/active-by-user?user_id=UUID
app.get('/subscriptions/active-by-user', async (req, res) => {
  const user_id = getUserId(req);
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Informe user_id' });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .in('status', ['ativo', 'active'])
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ status: 'error', message: mapSupabaseError(error) });
  return res.json({ status: 'ok', data });
});

// ---- Erro 404
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Not found' }));

// ---- Erro global
app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ status: 'error', message: 'Erro interno' });
});

// ---- Start
app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando na porta ${PORT} (host ${HOST})`);
});

