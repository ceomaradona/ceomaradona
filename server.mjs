// server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ======================
// Variáveis de ambiente
// ======================
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  PORT = 3000,
  HOST = '0.0.0.0',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[BOOT] Faltam SUPABASE_URL e/ou SUPABASE_KEY nas variáveis de ambiente');
  // Não derruba o processo: mantém o /health funcional para diagnóstico
}

// ======================
// Supabase (opcional)
// ======================
const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// ======================
// App Express
// ======================
const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// --------- HEALTH (não usa DB) ----------
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});
app.head('/health', (_req, res) => {
  res.status(200).end();
});

// --------- ROOT (não usa DB) ----------
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'planner-supabase-api',
    status: 'ok',
    now: new Date().toISOString(),
  });
});

// --------- Rotas de dados (com try/catch) ----------
app.get('/subscriptions/count/active', async (_req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ status: 'error', message: 'SUPABASE não configurado' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    res.json({ count: data?.length ?? 0 });
  } catch (err) {
    next(err);
  }
});

app.get('/subscriptions/history', async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ status: 'error', message: 'SUPABASE não configurado' });

    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ status: 'error', message: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ items: data ?? [] });
  } catch (err) {
    next(err);
  }
});

app.get('/subscriptions/latest', async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ status: 'error', message: 'SUPABASE não configurado' });

    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ status: 'error', message: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ latest: data ?? null });
  } catch (err) {
    next(err);
  }
});

app.get('/subscriptions/active-by-user', async (req, res, next) => {
  try {
    if (!supabase) return res.status(503).json({ status: 'error', message: 'SUPABASE não configurado' });

    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ status: 'error', message: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    res.json({ active: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// 404 explícito
app.use((req, res, _next) => {
  res.status(404).json({ status: 'error', message: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// Handler global de erros (prevenir 502 por throw não tratado)
app.use((err, _req, res, _next) => {
  console.error('[ERR]', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({ status: 'error', message: err?.message ?? 'Erro interno' });
});

// Evita derrubar o processo em rejeições não tratadas
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Start
app.set('trust proxy', true);
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} (host ${HOST})`);
});

// Melhora compatibilidade com proxies
server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;
