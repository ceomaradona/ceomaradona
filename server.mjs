// server.mjs — diagnóstico mínimo estável
import express from 'express';

const app = express();

// raiz: JSON simples
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// health: texto simples (HEAD/GET)
app.get('/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

// Porta/host — use a PORT do Railway; fallback só ajuda localmente
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`DIAG rodando na porta ${PORT} (host ${HOST})`);
});
