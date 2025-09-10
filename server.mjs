// server.mjs — API alinhada com Supabase (tabela: assinaturas)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ---- Variáveis de ambiente ----
const { SUPABASE_URL, SUPABASE_KEY, PORT } = process.env;
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

// ---- Helpers ----
function badRequest(res, msg) {
  return res.status(400).json({ status: 'error', message: msg });
}
function handleSb(res, { data, error, status = 200 }) {
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  return res.status(status).json(data);
}

// ------------------ ROTAS ------------------

// Healthcheck (texto)
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));

// Raiz (diagnóstico rápido)
app.get('/', (_req, res) => res.status(200).json({ ok: true, ts: new Date().toISOString() }));

// Nome da tabela no Supabase (PT-BR)
const TBL = 'assinaturas';

// Histórico completo do usuário
// GET /subscriptions/history?user_id=<uuid>
app.get('/subscriptions/history', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return badRequest(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .order('criado_em', { ascending: true });

  return handleSb(res, { data, error });
});

// Última assinatura do usuário
// GET /subscriptions/latest?user_id=<uuid>
app.get('/subscriptions/latest', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return badRequest(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  return handleSb(res, { data, error });
});

// Contagem de assinaturas ativas (geral)
// GET /subscriptions/count/active
app.get('/subscriptions/count/active', async (_req, res) => {
  const { count, error } = await supabase
    .from(TBL)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo');

  if (error) return res.status(500).json({ status: 'error', message: error.message });
  return res.status(200).json({ status: 'ok', count: count ?? 0 });
});

// Assinaturas ativas por usuário
// GET /subscriptions/active-by-user?user_id=<uuid>
app.get('/subscriptions/active-by-user', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return badRequest(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .eq('status', 'ativo');

  return handleSb(res, { data, error });
});

// 404 padrão
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Not found' }));

// Start (Railway)
const HOST = '0.0.0.0';
const listenPort = Number(PORT) || 8080;
app.listen(listenPort, HOST, () => {
  console.log(`Servidor rodando na porta ${listenPort} (host ${HOST})`);
});
