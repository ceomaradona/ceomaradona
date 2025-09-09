// server.mjs - diagnóstico mínimo
import express from 'express';

const app = express();

// raiz: JSON simples
app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// health: texto "ok"
app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

const PORT = Number(process.env.PORT || 8080);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[diag] listening on http://${HOST}:${PORT}`);
});
