import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// ==== Variáveis de ambiente ====
const { SUPABASE_URL, SUPABASE_KEY, PORT } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltam SUPABASE_URL ou SUPABASE_KEY nas variáveis de ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==== App Express ====
const app = express();

// CORS (liberado geral nesta primeira etapa)
app.use(cors());
app.use(express.json());

// ==== Rotas ====

// Health (para monitor e para você testar)
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Raiz (abre uma página simples)
app.get('/', (_req, res) => {
  res.status(200).send('<pre>Servidor online! Use /health e os endpoints da API.</pre>');
});

// Histórico completo de assinaturas por usuário
app.get('/subscriptions/history', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: String(err.message || err) });
  }
});

// Última assinatura do usuário (mais recente)
app.get('/subscriptions/latest', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json(data?.[0] || null);
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: String(err.message || err) });
  }
});

// Contagem de assinaturas ativas (global)
app.get('/subscriptions/count/active', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    res.json({ active_count: count ?? 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: String(err.message || err) });
  }
});

// Assinaturas ativas por usuário
app.get('/subscriptions/active-by-user', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: 'user_id é obrigatório' });

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: 'error', code: 500, message: String(err.message || err) });
  }
});

// ==== Suba o servidor ====
const port = Number(PORT) || 3000;
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});
