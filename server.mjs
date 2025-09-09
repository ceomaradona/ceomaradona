// server.mjs (diagnóstico mínimo)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const { PORT = 3000, HOST = '0.0.0.0' } = process.env;

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

// logs de requisição (ajuda a ver nos Deploy Logs)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// health e raiz SEM QUALQUER dependência
app.get('/health', (_req, res) => res.status(200).json({ ok: true, ts: new Date().toISOString() }));
app.head('/health', (_req, res) => res.status(200).end());

app.get('/', (_req, res) => res.status(200).json({ name: 'diagnostic', status: 'ok', now: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ status: 'error', message: `Rota não encontrada: ${req.method} ${req.originalUrl}` }));

// erro global
app.use((err, _req, res, _next) => {
  console.error('[ERR]', err);
  res.status(500).json({ status: 'error', message: err?.message ?? 'Erro interno' });
});

process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 DIAG rodando na porta ${PORT} (host ${HOST})`);
});
server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;
