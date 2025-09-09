// server.mjs

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ----- Variáveis de ambiente -----
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

// ----- Supabase -----
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ----- App Express -----
const app = express();
app.use(cors());
app.use(express.json());

// ---------- Health & raiz ----------
app.get('/health', (_, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

app.get('/', (_, res) => {
  res.status(200).json({
    name: 'ceomaradona API',
    docs: '/subscriptions/*',
    health: '/health',
  });
});

// ---------- Rotas de subscriptions ----------

// Histórico completo do usuário
app.get('/subscriptions/history', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ items: data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Última assinatura do usuário
app.get('/subscriptions/latest', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json({ item: data?.[0] ?? null });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Contagem de assinaturas ativas
app.get('/subscriptions/count/active', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { head: true, count: 'exact' })
      .eq('status', 'active');

    if (error) throw error;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Assinaturas ativas por usuário (retorna count)
app.get('/subscriptions/active-by-user', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { count, error } = await supabase
      .from('subscriptions')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (error) throw error;
    res.json({ active_count: count ?? 0, active: (count ?? 0) > 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- Sobe o servidor ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
