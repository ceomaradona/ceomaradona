// server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

/** ========= Variáveis de ambiente ========= */
const { SUPABASE_URL, SUPABASE_KEY, PORT: RAILWAY_PORT } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltam SUPABASE_URL e/ou SUPABASE_KEY nas variáveis de ambiente.');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// App Express
const app = express();
app.use(express.json());

/** ========= CORS (libere seu app e o localhost) ========= */
// Ajuste a allowlist quando tiver a URL final do Lovable / seu front
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://seu-app-do-lovable.app' // troque quando tiver sua URL
];

app.use(
  cors({
    origin(origin, cb) {
      // permite ferramentas como curl/postman (sem origin)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    }
  })
);

/** ========= Health ========= */
app.get('/', (_req, res) => {
  res.status(200).send('✅ Servidor online!');
});

/** ========= Endpoints da API =========
 * Ajustados para os nomes das views/tabelas que você criou no Supabase:
 * - subscription_history                      (tabela)
 * - current_user_subscription_view            (view)
 * - active_user_subscriptions_view            (view)
 */

// 1) Histórico completo do usuário
app.get('/subscriptions/history', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// 2) Última assinatura do usuário
app.get('/subscriptions/latest', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('current_user_subscription_view')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json(data?.[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// 3) Contagem de assinaturas ativas (todas)
app.get('/subscriptions/count/active', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('active_user_subscriptions_view')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ active_count: count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// 4) Assinaturas ativas por usuário
app.get('/subscriptions/active-by-user', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'Parâmetro user_id é obrigatório' });

    const { data, error } = await supabase
      .from('active_user_subscriptions_view')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

/** ========= Start do servidor =========
 * IMPORTANTE: ouvir a porta do Railway
 */
const PORT = RAILWAY_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
