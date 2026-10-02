import fs from 'node:fs';

const sourceFile = 'index.html';
let appHtml = fs.readFileSync(sourceFile, 'utf8');

function patchLegacyHtml(html) {
  let out = html;

  out = out.replace(
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">\n// ============================================================\n// EMPRESAS ONLINE — SUPABASE',
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script>\n// ============================================================\n// EMPRESAS ONLINE — SUPABASE'
  );

  out = out.replace(/\n<script id="contai-emergency-login">[\s\S]*?<\/script>\n(?=<\/body><\/html>)/g, '\n');
  out = out.replace(/\n<script src="\/login-fix\.js"><\/script>\n(?=<\/body><\/html>)/g, '\n');

  const guard = `
<script>
(function(){
  try {
    const auth = sessionStorage.getItem('contai_auth_ok');
    if (!auth) window.location.replace('/');
  } catch (e) {
    window.location.replace('/');
  }
})();
</script>`;

  if (!out.includes('contai_auth_ok')) {
    out = out.replace('</head>', `${guard}\n</head>`);
  }

  return out;
}

function extractConfig(html) {
  const url = process.env.VITE_SUPABASE_URL
    || process.env.SUPABASE_URL
    || (html.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i) || [])[0]
    || '';

  const key = process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || (html.match(/eyJ[A-Za-z0-9_\-.]+/g) || []).find(v => v.length > 80)
    || '';

  return { url, key };
}

const { url, key } = extractConfig(appHtml);
const safeUrl = JSON.stringify(url);
const safeKey = JSON.stringify(key);

const loginHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cont.AI | Login</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;background:radial-gradient(circle at 80% 20%,rgba(120,40,55,.35),transparent 28%),linear-gradient(135deg,#0c111a,#161b24 55%,#111827);color:#fff;display:grid;place-items:center}.wrap{width:min(1120px,calc(100vw - 32px));display:grid;grid-template-columns:1.1fr 420px;gap:34px;align-items:center}.brand{display:flex;align-items:center;gap:14px;margin-bottom:42px}.logo{width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#273244,#4b5563);display:grid;place-items:center;font-weight:900;box-shadow:0 22px 55px rgba(0,0,0,.35)}h1{font-size:58px;line-height:1;margin:0 0 20px;letter-spacing:-.06em}.lead{color:#cbd5e1;font-size:17px;line-height:1.7;max-width:720px}.chips{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.chip{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);border-radius:999px;padding:10px 14px;color:#dbeafe;font-weight:700;font-size:13px}.card{background:rgba(255,255,255,.96);color:#111827;border-radius:28px;padding:30px;box-shadow:0 34px 90px rgba(0,0,0,.38)}.card h2{margin:0 0 8px;font-size:26px}.card p{margin:0 0 22px;color:#667085}label{display:block;margin:14px 0 6px;color:#475467;text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:900}input{width:100%;height:46px;border:1px solid #cbd5e1;border-radius:14px;padding:0 14px;font-size:15px;outline:none}input:focus{border-color:#0078d4;box-shadow:0 0 0 4px rgba(0,120,212,.14)}button{width:100%;height:48px;margin-top:20px;border:0;border-radius:14px;background:#b42318;color:#fff;font-size:15px;font-weight:900;cursor:pointer}button:hover{filter:brightness(.95)}.msg{min-height:20px;margin-top:14px;color:#b42318;font-size:13px}.small{margin-top:16px;color:#667085;font-size:12px;line-height:1.5}@media(max-width:900px){.wrap{grid-template-columns:1fr}h1{font-size:40px}.card{order:-1}}
</style>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
<div class="wrap">
  <section>
    <div class="brand"><div class="logo">CE</div><div><strong>Cont.AI</strong><br><span style="color:#94a3b8">Controle de empresas para escritórios contábeis</span></div></div>
    <h1>Organize empresas, obrigações, documentos e prazos.</h1>
    <p class="lead">Acesso seguro ao painel de controle. Entre com o e-mail e a senha cadastrados no Supabase.</p>
    <div class="chips"><span class="chip">Empresas</span><span class="chip">Obrigações</span><span class="chip">Documentos</span><span class="chip">Relatórios</span></div>
  </section>
  <form class="card" id="loginForm">
    <h2>Faça seu login</h2>
    <p>Informe seus dados para acessar o sistema.</p>
    <label for="email">E-mail</label>
    <input id="email" type="email" autocomplete="username" placeholder="marcoswilc@gmail.com" required>
    <label for="password">Senha</label>
    <input id="password" type="password" autocomplete="current-password" placeholder="Digite sua senha" required>
    <button id="btnLogin" type="submit">Entrar no painel</button>
    <div class="msg" id="msg"></div>
    <div class="small">Se a senha foi alterada pelo SQL Editor, use a nova senha definida no Supabase.</div>
  </form>
</div>
<script>
const SUPABASE_URL = ${safeUrl};
const SUPABASE_KEY = ${safeKey};
const msg = document.getElementById('msg');
const form = document.getElementById('loginForm');
if (!SUPABASE_URL || !SUPABASE_KEY) {
  msg.textContent = 'Configuração do Supabase não localizada no Render.';
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  msg.textContent = 'Validando acesso...';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data || !data.user) {
      msg.textContent = error?.message || 'E-mail ou senha inválidos.';
      return;
    }
    sessionStorage.setItem('contai_auth_ok', JSON.stringify({ email: data.user.email, id: data.user.id, ts: Date.now() }));
    window.location.href = '/app.html';
  } catch (err) {
    console.error(err);
    msg.textContent = 'Erro ao conectar com o Supabase.';
  }
});
</script>
</body>
</html>`;

const finalApp = patchLegacyHtml(appHtml);
fs.writeFileSync('app.html', finalApp, 'utf8');
fs.writeFileSync('index.html', loginHtml, 'utf8');
console.log('[fix-index] gerado index.html de login limpo');
console.log('[fix-index] gerado app.html com sistema completo');
console.log(`[fix-index] supabase url: ${url ? 'ok' : 'faltando'} | anon key: ${key ? 'ok' : 'faltando'}`);
