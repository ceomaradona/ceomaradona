// server.mjs — versão estável para Railway

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ---- Variáveis de ambiente ----
const {
  PORT = 8080,
  SUPABASE_URL,
  SUPABASE_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

// ---- Clientes / App ----
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const app = express();
app.use(cors({ origin: '*', methods: ['GET'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// ---- Rotas “leves” (não dependem do banco) ----
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', at: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.status(200).send('ok');
});

// (evita 404 ruidoso de favicon em monitores)
app.get('/favicon.ico', (_req, res) => res.sendStatus(204));

// ---- Rotas de dados ----

// Contagem de assinaturas ativas
app.get('/subscriptions/count/active', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    res.json({ count: count ?? 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Histórico completo do usuário
app.get('/subscriptions/history', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Última assinatura do usuário
app.get('/subscriptions/latest', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json({ data: data?.[0] ?? null });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Assinaturas ativas por usuário
app.get('/subscriptions/active-by-user', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ status: 'error', message: 'user_id obrigatório' });

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---- Sobe o servidor (bind em 0.0.0.0) ----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
