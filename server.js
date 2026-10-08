import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

const COOKIE_NAME = 'ce_session';
const USER_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
const PASS_HASH = '639405bc786621f9402bf115fee450dbb74b96a486d294a48cfda90a6ffb5743';
const SESSION_SECRET = process.env.SESSION_SECRET || 'controle-empresa-stable-session';

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '2mb' }));

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '').trim()).digest('hex');
}
function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}
function createSession() {
  const payload = `admin:${Date.now()}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}
function readCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '')
    .split(';')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => {
      const i = v.indexOf('=');
      return i >= 0 ? [v.slice(0, i), decodeURIComponent(v.slice(i + 1))] : [v, ''];
    }));
}
function isAuthed(req) {
  const token = readCookies(req)[COOKIE_NAME];
  if (!token || !token.includes('.')) return false;
  const [raw, sig] = token.split('.');
  try {
    const payload = Buffer.from(raw, 'base64url').toString('utf8');
    return payload.startsWith('admin:') && sig === sign(payload);
  } catch {
    return false;
  }
}
function setSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(createSession())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`);
}
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  return res.redirect('/login');
}
function readIndexHtml() {
  return fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
}

const loginPage = (error = '') => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Controle de Empresa | Login</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 25% 10%,#2b3442 0,#111827 44%,#090d14 100%);font-family:'Segoe UI',Arial,sans-serif;color:#101828}.wrap{width:min(980px,94vw);display:grid;grid-template-columns:1.15fr .85fr;border:1px solid rgba(255,255,255,.12);border-radius:28px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.35)}.brand{padding:48px;background:linear-gradient(135deg,#101722,#1f2937);color:#fff}.badge{display:inline-flex;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.10);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.brand h1{font-size:40px;line-height:1.05;margin:24px 0 12px}.brand p{color:rgba(255,255,255,.76);line-height:1.65}.list{margin-top:24px;display:grid;gap:16px}.item{display:flex;gap:12px;align-items:center;border-top:1px solid rgba(255,255,255,.10);padding-top:16px}.dot{width:9px;height:9px;background:#e0352b;border-radius:99px}.panel{background:#fff;padding:42px;display:flex;flex-direction:column;justify-content:center}.mark{width:46px;height:46px;border-radius:14px;background:#1f2937;color:#fff;display:grid;place-items:center;font-weight:900;margin-bottom:18px}.panel h2{margin:0 0 6px;font-size:24px}.panel p{margin:0 0 26px;color:#667085;font-size:14px}.field{margin-bottom:16px}.field label{display:block;font-size:12px;font-weight:800;color:#475467;margin-bottom:8px;text-transform:uppercase}.field input{width:100%;height:48px;border:1px solid #cfd6e4;border-radius:14px;padding:0 14px;font-size:15px;outline:none}.field input:focus{border-color:#8aa4cf;box-shadow:0 0 0 4px rgba(25,88,170,.08)}button{width:100%;height:48px;border:0;border-radius:14px;background:linear-gradient(135deg,#c2251a,#8f1812);color:#fff;font-weight:900;font-size:15px;cursor:pointer;margin-top:8px}.error{background:#fff1f0;border:1px solid #ffccc7;color:#a8071a;padding:12px 14px;border-radius:12px;font-size:13px;margin-bottom:16px}.foot{margin-top:18px;border:1px solid #e4e7ec;border-radius:14px;padding:12px;color:#667085;font-size:12px}.public-link{display:block;margin-top:14px;text-align:center;color:#667085;font-size:13px;text-decoration:none}@media(max-width:820px){.wrap{grid-template-columns:1fr}.brand{display:none}.panel{padding:30px 22px}}
</style>
</head>
<body>
<main class="wrap">
  <section class="brand"><span class="badge">Acesso seguro</span><h1>Controle de Empresa</h1><p>Ambiente estável para acessar o painel, obrigações, documentos, área do cliente e rotinas do escritório.</p><div class="list"><div class="item"><span class="dot"></span><span>Login controlado pelo servidor</span></div><div class="item"><span class="dot"></span><span>Sem conflito com o HTML antigo</span></div><div class="item"><span class="dot"></span><span>EmitLeve separado do fluxo de acesso</span></div></div></section>
  <section class="panel"><div class="mark">CE</div><h2>Entrar no sistema</h2><p>Informe seu usuário e senha para continuar.</p>${error ? `<div class="error">${error}</div>` : ''}<form method="post" action="/login"><div class="field"><label>Usuário</label><input name="user" autocomplete="username" required autofocus></div><div class="field"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required></div><button type="submit">Entrar no controle</button></form><a class="public-link" href="/">Voltar para a apresentação</a><div class="foot">Acesso restrito aos usuários cadastrados.</div></section>
</main>
</body>
</html>`;

const emitLeveStyle = `
<style id="ceEmitLeveStyle">
.emit-promo-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,.62);backdrop-filter:blur(8px);z-index:4500}.emit-promo-overlay.open{display:flex}.emit-promo-wrap{position:relative;width:min(760px,100%)}.emit-promo-card{width:100%;background:linear-gradient(145deg,rgba(8,14,25,.96),rgba(24,32,50,.96));color:#f5f7fb;border-radius:26px;overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.42);display:grid;grid-template-columns:1.06fr .94fr}.emit-promo-main,.emit-promo-side{padding:28px}.emit-promo-side{background:rgba(255,255,255,.06)}.emit-badge{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.08);font-size:12px;font-weight:700;text-transform:uppercase}.emit-badge-mark{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#b42318;color:#fff;font-weight:800}.emit-promo-title{margin:16px 0 10px;font-size:34px;line-height:1.08;font-weight:800}.emit-promo-text{margin:0 0 20px;color:rgba(241,245,249,.82);font-size:15px;line-height:1.7}.emit-promo-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}.emit-promo-list li{display:flex;gap:12px;color:rgba(241,245,249,.92);font-size:14px;line-height:1.5}.emit-promo-dot{width:10px;height:10px;border-radius:999px;margin-top:6px;background:#cf2f1d;flex:0 0 auto}.emit-promo-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.emit-btn{border:0;border-radius:16px;padding:13px 18px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none}.emit-btn.primary{background:#b42318;color:#fff}.emit-btn.ghost{background:rgba(255,255,255,.08);color:#fff}.emit-close{position:absolute;top:16px;right:16px;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font-size:18px;cursor:pointer;z-index:2}.emit-floating-launcher{position:fixed;right:18px;bottom:18px;z-index:2600;display:inline-flex;align-items:center;gap:10px;padding:12px 16px;border:0;border-radius:999px;background:#b42318;color:#fff;box-shadow:0 14px 34px rgba(141,18,18,.30);font:700 13px/1 'Segoe UI',Arial,sans-serif;cursor:pointer}.emit-floating-mark{width:28px;height:28px;border-radius:10px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-weight:900}@media(max-width:800px){.emit-promo-card{grid-template-columns:1fr}.emit-promo-side{display:none}}
</style>`;

const emitLeveHtml = `
<button type="button" class="emit-floating-launcher" id="emitLeveLauncher"><span class="emit-floating-mark">EL</span><span>EmitLeve</span></button>
<div class="emit-promo-overlay" id="emitLevePromo" aria-hidden="true"><div class="emit-promo-wrap"><button type="button" class="emit-close" id="emitLevePromoClose">✕</button><div class="emit-promo-card"><div class="emit-promo-main"><div class="emit-badge"><span class="emit-badge-mark">EL</span> Destaque do ecossistema</div><h3 class="emit-promo-title">Conheça o EmitLeve</h3><p class="emit-promo-text">Emissão prática de NFSe com fluxo pensado para o contador: onboarding guiado, envio por WhatsApp, importação de XML/PDF, compra de créditos e acompanhamento do cliente em um único lugar.</p><ul class="emit-promo-list"><li><span class="emit-promo-dot"></span><span>Compra de créditos com validade de <strong>30 dias</strong>.</span></li><li><span class="emit-promo-dot"></span><span>Integração com cobrança para automatizar a liberação de créditos.</span></li><li><span class="emit-promo-dot"></span><span>Experiência simples para o cliente e controle claro para o escritório.</span></li></ul><div class="emit-promo-actions"><a class="emit-btn primary" href="https://emitleve.com.br" target="_blank" rel="noopener noreferrer">Quero conhecer o EmitLeve</a><button type="button" class="emit-btn ghost" id="emitLevePromoLater">Lembrar depois</button></div></div><div class="emit-promo-side"><h3>Controle + EmitLeve</h3><p>Organize a rotina no Controle de Empresa e apresente o EmitLeve para clientes que precisam emitir notas com praticidade.</p></div></div></div></div>`;

const emitLeveScript = `
<script id="ceEmitLeveScript">
(function(){
  window.ceOpenEmitLevePromo=function(){var e=document.getElementById('emitLevePromo');if(e){e.classList.add('open');e.setAttribute('aria-hidden','false')}};
  function closePromo(){var e=document.getElementById('emitLevePromo');if(e){e.classList.remove('open');e.setAttribute('aria-hidden','true')}}
  document.addEventListener('DOMContentLoaded',function(){
    var launcher=document.getElementById('emitLeveLauncher');
    var close=document.getElementById('emitLevePromoClose');
    var later=document.getElementById('emitLevePromoLater');
    var overlay=document.getElementById('emitLevePromo');
    if(launcher) launcher.addEventListener('click',window.ceOpenEmitLevePromo);
    if(close) close.addEventListener('click',closePromo);
    if(later) later.addEventListener('click',closePromo);
    if(overlay) overlay.addEventListener('click',function(e){if(e.target===overlay)closePromo()});
  });
})();
</script>`;

const publicLoginButton = `
<style id="cePublicLoginButtonStyle">
.ce-public-login-fixed{position:fixed;right:22px;top:18px;z-index:999999;display:inline-flex;align-items:center;gap:10px;height:42px;padding:0 18px;border-radius:999px;background:linear-gradient(135deg,#b42318,#8f1b13);color:#fff!important;text-decoration:none!important;font:800 13px/1 'Segoe UI',Arial,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.18)}.ce-public-login-fixed:hover{filter:brightness(.96);transform:translateY(-1px)}@media(max-width:720px){.ce-public-login-fixed{right:12px;top:12px;height:38px;padding:0 14px;font-size:12px}}
</style>
<a class="ce-public-login-fixed" href="/login" data-ce-login-fixed="1">Entrar no sistema</a>
<script id="cePublicLandingPatch">
(function(){
  function goLogin(ev){ if(ev){ ev.preventDefault(); ev.stopPropagation(); } window.location.assign('/login'); }
  function isLoginTrigger(el){
    if(!el) return false;
    var text=String(el.textContent||el.value||el.getAttribute('aria-label')||'').toLowerCase();
    var id=String(el.id||'').toLowerCase();
    var cls=String(el.className||'').toLowerCase();
    return text.includes('login') || text.includes('entrar') || text.includes('acessar') || id.includes('login') || cls.includes('login');
  }
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('a,button,[role="button"],input[type="button"],input[type="submit"]').forEach(function(el){
      if(el.getAttribute('data-ce-login-fixed')) return;
      if(isLoginTrigger(el)){
        if(el.tagName==='A') el.setAttribute('href','/login');
        el.addEventListener('click', goLogin, true);
      }
    });
    document.addEventListener('click',function(ev){
      var el=ev.target.closest && ev.target.closest('a,button,[role="button"],input[type="button"],input[type="submit"]');
      if(el && !el.getAttribute('data-ce-login-fixed') && isLoginTrigger(el)) goLogin(ev);
    },true);
  });
})();
</script>`;

const appUnlockStyle = `
<style id="ceAppUnlockStyle">
.landing-screen,.login-screen,#loginScreen,.login-overlay,.login-modal,.login-popup-backdrop{display:none!important;visibility:hidden!important;pointer-events:none!important}.app,#app{display:grid!important;visibility:visible!important;opacity:1!important}body{overflow:auto!important;background:#f3f6fb!important}
</style>`;

const appUnlockScript = `
<script id="ceAppUnlockScript">
(function(){
  function unlock(){
    document.body.classList.add('is-authenticated');
    ['.landing-screen','.login-screen','#loginScreen','.login-overlay','.login-modal','.login-popup-backdrop'].forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){el.remove();});});
    var app=document.getElementById('app')||document.querySelector('.app');
    if(app){app.style.display='grid';app.style.visibility='visible';app.style.opacity='1';}
    try{localStorage.setItem('ce_force_auth','1');localStorage.setItem('ce_session','server-authenticated');}catch(e){}
  }
  document.addEventListener('DOMContentLoaded',unlock);
  setTimeout(unlock,100);
  setTimeout(unlock,500);
})();
</script>`;

function injectEmitLeve(html) {
  if (!html.includes('ceEmitLeveStyle')) html = html.replace('</head>', `${emitLeveStyle}\n</head>`);
  if (!html.includes('ceEmitLeveScript')) html = html.replace('</body>', `${emitLeveHtml}\n${emitLeveScript}\n</body>`);
  return html;
}
function renderPublicLanding() {
  let html = readIndexHtml();
  if (!html.includes('cePublicLandingPatch')) html = html.replace('</body>', `${publicLoginButton}\n</body>`);
  return html;
}
function renderAppHtml() {
  let html = readIndexHtml();
  if (!html.includes('ceAppUnlockStyle')) html = html.replace('</head>', `${appUnlockStyle}\n</head>`);
  if (!html.includes('ceAppUnlockScript')) html = html.replace('</body>', `${appUnlockScript}\n</body>`);
  return injectEmitLeve(html);
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'public-landing-fixed-login-button', timestamp: new Date().toISOString() }));
app.get(['/', '/demo'], (_req, res) => res.type('html').send(renderPublicLanding()));
app.get('/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/app');
  return res.type('html').send(loginPage());
});
app.post('/login', (req, res) => {
  const userOk = sha256(req.body.user) === USER_HASH;
  const passOk = sha256(req.body.password) === PASS_HASH;
  if (!userOk || !passOk) return res.status(401).type('html').send(loginPage('Usuário ou senha inválidos.'));
  setSessionCookie(res);
  return res.redirect('/app');
});
app.get('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.redirect('/login');
});
app.get(['/app', '/app.html'], requireAuth, (_req, res) => res.type('html').send(renderAppHtml()));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.redirect('/'));

app.listen(PORT, () => console.log(`Controle de Empresa rodando na porta ${PORT} - landing publica com login fixo`));
