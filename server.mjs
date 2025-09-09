// server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ---- Variáveis de ambiente ----
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

// ---- Supabase ----
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- App Express ----
const app = express();
app.use(express.json());

// CORS: libere o seu front mais tarde; por enquanto, libera geral para facilitar teste
app.use(cors());

// ---------- Healthcheck (resposta super rápida) ----------
app.get('/health', (_req, res) => {
  // resposta mínima — evita qualquer I/O e garante 200
  res.status(200).send('ok');
});

// ---------- Raiz ----------
app.get('/', (_req, res) => {
  res.status(200).send('Servidor online!');
});

// ---------- Rotas de exemplo (ajuste a sua tabela/visões no Supabase) ----------
app.get('/subscriptions/history', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const { data, error } = await supabase
      .from('user_subscriptions_history')
      .select('*')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err.message ?? err) });
  }
});

app.get('/subscriptions/latest', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('start_date', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json(data?.[0] ?? null);
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err.message ?? err) });
  }
});

app.get('/subscriptions/count/active', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    res.json({ active_count: count ?? 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err.message ?? err) });
  }
});

app.get('/subscriptions/active-by-user', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ status: 'error', message: String(err.message ?? err) });
  }
});

// ---- Inicie o servidor ----
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
