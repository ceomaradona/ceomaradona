// server.mjs — API oficial (Express + Supabase)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// --- Ambiente ---
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_KEY nas variáveis de ambiente.');
  process.exit(1);
}

// --- Supabase ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- App ---
const app = express();
app.use(cors());
app.use(express.json());

// ---- Health (plaintext) ----
app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

// ---- Raiz (JSON simples) ----
app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// -------- Rotas de subscriptions ----------

// 1) Histórico completo do usuário
// GET /subscriptions/history?user_id=UUID
app.get('/subscriptions/history', async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id_do_usuario', user_id)
      .order('data_de_inicio', { ascending: false });

    if (error) throw error;
    res.json({ status: 'ok', items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// 2) Última assinatura do usuário
// GET /subscriptions/latest?user_id=UUID
app.get('/subscriptions/latest', async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id_do_usuario', user_id)
      .order('data_de_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ status: 'ok', latest: data ?? null });
  } catch (err) {
    next(err);
  }
});

// 3) Contagem de assinaturas ativas (status = 'ativo')
app.get('/subscriptions/count/active', async (_req, res, next) => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo');

    if (error) throw error;
    res.json({ status: 'ok', count: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// 4) Assinaturas ativas por usuário
// GET /subscriptions/active-by-user?user_id=UUID
app.get('/subscriptions/active-by-user', async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id_do_usuario', user_id)
      .eq('status', 'ativo');

    if (error) throw error;
    res.json({ status: 'ok', active_count: data?.length ?? 0, items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// ---- Tratador de erro global (sempre JSON) ----
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: err.message ?? 'internal error' });
});

// ---- Start ----
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando na porta ${PORT} (host ${HOST})`);
});
