// server.mjs — API REST estável (assinaturas)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

/* ---- Variáveis de ambiente ---- */
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  PORT = 8080,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

/* ---- Supabase ---- */
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---- App Express ---- */
const app = express();
app.use(cors());
app.use(express.json());

/* ---- Helpers ---- */
const ok = (res, data) => res.status(200).json({ status: 'ok', data });
const bad = (res, code, message) =>
  res.status(code).json({ status: 'error', message });

function mapRow(r) {
  // Tabela real: public.assinaturas
  return {
    id: r.id ?? null,
    user_id: r.id_do_usuario,
    status: r.status,
    plan: r.plano,
    price: r.preco,
    start_date: r.data_de_inicio,
    end_date: r.data_final,
    created_at: r.criado_em,
  };
}

async function historyByUser(user_id) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id_do_usuario', user_id)
    .order('data_de_inicio', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

async function latestByUser(user_id) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id_do_usuario', user_id)
    .order('data_de_inicio', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // not found
  return data ? mapRow(data) : null;
}

async function countActive() {
  const { count, error } = await supabase
    .from('assinaturas')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ativo');

  if (error) throw error;
  return count ?? 0;
}

async function activeByUser(user_id) {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('id_do_usuario', user_id)
    .eq('status', 'ativo');

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/* ---- Rotas de diagnóstico ---- */
app.get('/', (_req, res) => ok(res, { ok: true, ts: new Date().toISOString() }));

app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/diag', (_req, res) => {
  ok(res, {
    ok: true,
    ts: new Date().toISOString(),
    env: {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY,
    },
    table: 'assinaturas',
  });
});

/* ---- Rotas REST (MVP) ----
   - Histórico do usuário
   - Última assinatura do usuário
   - Contagem de ativas (geral)
   - Assinaturas ativas por usuário
-------------------------------- */

app.get('/users/:id/subscriptions/history', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return bad(res, 400, 'user_id ausente');
    const data = await historyByUser(id);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
});

app.get('/users/:id/subscriptions/latest', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return bad(res, 400, 'user_id ausente');
    const data = await latestByUser(id);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
});

app.get('/subscriptions/active/count', async (_req, res, next) => {
  try {
    const count = await countActive();
    return ok(res, { count });
  } catch (err) {
    return next(err);
  }
});

app.get('/users/:id/subscriptions/active', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return bad(res, 400, 'user_id ausente');
    const data = await activeByUser(id);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
});

/* 404 para rotas desconhecidas */
app.use((_req, res) => bad(res, 404, 'Not Found'));

/* Handler global de erros */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  return bad(res, 500, err?.message || 'Internal Server Error');
});

/* Start */
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando na porta ${PORT} (host ${HOST})`);
});
