const BASE = location.origin; // http://localhost:3000
document.getElementById("base").textContent = `Base: ${BASE}`;

async function call(path){
  const pre = document.getElementById("out");
  pre.textContent = "Carregando...";
  try{
    const res = await fetch(BASE + path);
    const text = await res.text();
    try{ pre.textContent = JSON.stringify(JSON.parse(text), null, 2) }
    catch{ pre.textContent = text }
  }catch(err){
    pre.textContent = "Erro: " + err.message;
  }
}

function user(prefix){
  const id = document.getElementById("userId").value.trim();
  if (!id) return alert("Informe o USER_ID");
  call(prefix + encodeURIComponent(id));
}
