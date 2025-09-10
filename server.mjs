// server.mjs — API alinhada ao Supabase (tabela: assinaturas)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_KEY, PORT } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_KEY nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANTÍSSIMO: sempre daqui
const TBL = 'assinaturas';

const ok = (res, data) => res.status(200).json(data);
const err = (res, e) => res.status(500).json({ status: 'error', message: e.message || String(e) });
const bad = (res, m) => res.status(400).json({ status: 'error', message: m });

// Health e raiz
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));
app.get('/', (_req, res) => ok(res, { ok: true, ts: new Date().toISOString() }));

// Diagnóstico rápido
app.get('/diag', (_req, res) =>
  ok(res, {
    ok: true,
    table: TBL,
    env: { hasUrl: !!process.env.SUPABASE_URL, hasKey: !!process.env.SUPABASE_KEY },
    ts: new Date().toISOString(),
  })
);

// Histórico completo: ?user_id=<uuid>
app.get('/subscriptions/history', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return bad(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .order('criado_em', { ascending: true });

  if (error) return err(res, error);
  return ok(res, data);
});

// Última assinatura: ?user_id=<uuid>
app.get('/subscriptions/latest', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return bad(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return err(res, error);
  return ok(res, data);
});

// Contagem de todas ativas (geral)
app.get('/subscriptions/count/active', async (_req, res) => {
  const { count, error } = await supabase
    .from(TBL)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo');

  if (error) return err(res, error);
  return ok(res, { status: 'ok', count: count ?? 0 });
});

// Ativas do usuário: ?user_id=<uuid>
app.get('/subscriptions/active-by-user', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return bad(res, 'Parâmetro user_id é obrigatório');

  const { data, error } = await supabase
    .from(TBL)
    .select('*')
    .eq('id_do_usuario', userId)
    .eq('status', 'ativo');

  if (error) return err(res, error);
  return ok(res, data);
});

// 404
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Not found' }));

const HOST = '0.0.0.0';
const listenPort = Number(PORT) || 8080;
app.listen(listenPort, HOST, () =>
  console.log(`Servidor rodando na porta ${listenPort} (host ${HOST})`)
);
