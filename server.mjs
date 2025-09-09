import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Variáveis de ambiente
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltam SUPABASE_URL ou SUPABASE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- App Express ---
const app = express();
app.use(cors());
app.use(express.json());

// CORS: permita somente o seu app web
const ALLOWED_ORIGINS = [
  "http://localhost:3001",         // enquanto desenvolve o app
  "https://SEU-APP-DO-LOVABLE.app" // troque quando tiver a URL final do Lovable
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  }
}));

// Health-check
app.get("/", (_, res) => {
  res.status(200).send("✅ Servidor online!");
});

// 1) Histórico completo (view: subscription_history)
app.get("/subscriptions/history", async (req, res) => {
  const { user_id } = req.query;
  const { data, error } = await supabase
    .from("subscription_history")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2) Última assinatura (view: current_user_subscription_view)
app.get("/subscriptions/latest", async (req, res) => {
  const { user_id } = req.query;
  const { data, error } = await supabase
    .from("current_user_subscription_view")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0] || null);
});

// 3) Contagem de ativas (tabela subscriptions)
app.get("/subscriptions/count/active", async (_, res) => {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ active_count: count });
});

// 4) Assinaturas ativas por usuário (view: active_user_subscriptions_view)
app.get("/subscriptions/active-by-user", async (req, res) => {
  const { user_id } = req.query;
  const { data, error } = await supabase
    .from("active_user_subscriptions_view")
    .select("*")
    .eq("user_id", user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 5) Todas as assinaturas (debug)
app.get("/subscriptions/all", async (_, res) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
