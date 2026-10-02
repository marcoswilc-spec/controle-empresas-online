import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

function replaceOnce(from, to, label) {
  if (html.includes(from)) {
    html = html.replace(from, to);
    changed = true;
    console.log(`[fix-index] corrigido: ${label}`);
  } else {
    console.log(`[fix-index] já ok ou padrão não encontrado: ${label}`);
  }
}

// Correção 1: a biblioteca do Supabase precisa fechar a tag antes do script próprio.
replaceOnce(
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">\n// ============================================================\n// EMPRESAS ONLINE — SUPABASE',
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script>\n// ============================================================\n// EMPRESAS ONLINE — SUPABASE',
  'tag script Supabase'
);

// Correção 2: um <script> do patch online foi parar dentro do HTML impresso do calendário.
const brokenPrint = 'w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Calendário de Obrigações</title><style>@page{size:A4;margin:12mm}body{font-family:\'Calibri Light\',Calibri,Arial,sans-serif;color:#172033;font-size:11px}h1{font-size:20px;margin:0 0 4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #e5e7eb;padding:6px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Calendário de Obrigações</h1><p>Competência ${escapeHtml(comp)} • gerado em ${new Date().toLocaleString("pt-BR")}</p><table><thead><tr><th>Prazo</th><th>Empresa</th><th>Obrigação</th><th>Status</th><th>Responsável</th></tr></thead><tbody>${rows || \'<tr><td colspan="5">Nenhuma obrigação com prazo.</td></tr>\'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),200)<\\/script>\n<script>';

const fixedPrint = 'w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Calendário de Obrigações</title><style>@page{size:A4;margin:12mm}body{font-family:\'Calibri Light\',Calibri,Arial,sans-serif;color:#172033;font-size:11px}h1{font-size:20px;margin:0 0 4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #e5e7eb;padding:6px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Calendário de Obrigações</h1><p>Competência ${escapeHtml(comp)} • gerado em ${new Date().toLocaleString("pt-BR")}</p><table><thead><tr><th>Prazo</th><th>Empresa</th><th>Obrigação</th><th>Status</th><th>Responsável</th></tr></thead><tbody>${rows || \'<tr><td colspan="5">Nenhuma obrigação com prazo.</td></tr>\'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),200)<\\/script></body></html>`);\n  w.document.close();\n}\n\n\n<script>';

replaceOnce(brokenPrint, fixedPrint, 'impressão calendário / script fora do lugar');

replaceOnce(
  '</script>\n\n</body></html>`);\n  w.document.close();\n}\n\nfunction renderKpi(k){',
  'function renderKpi(k){',
  'fechamento duplicado após patch online'
);

// Remove fallback antigo para reinjetar a versão robusta.
html = html.replace(/\n<script id="contai-emergency-login">[\s\S]*?<\/script>\n(?=<\/body><\/html>)/g, '\n');

const emergencyLogin = `
<script id="contai-emergency-login">
(function(){
  var SUPA_URL = "https://qnqmmrvhqxpenhqyesbc.supabase.co";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucW1tcnZocXhwZW5ocXllc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDcyMDMsImV4cCI6MjEwNDAyMzIwM30.D-p9PGuOEUBKuRo2iURkI02lJ1enuy5qDL41DqEZKgCU";
  function onReady(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function forceShowNativePopup(sourceEl){
    try{ if(typeof window.abrirLoginPopup === 'function') window.abrirLoginPopup(sourceEl || null); }catch(e){ console.warn('abrirLoginPopup falhou', e); }
    var popup = document.getElementById('loginPopup');
    if(!popup) return false;
    popup.classList.remove('closing');
    popup.classList.add('open');
    popup.setAttribute('aria-hidden','false');
    popup.style.display = 'flex';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    popup.style.pointerEvents = 'auto';
    popup.style.zIndex = '2147483646';
    document.body.classList.add('login-modal-open');
    var card = popup.querySelector('.login-popup-card,.login-card-popup,.login-card');
    if(card){ card.style.display = card.classList.contains('login-popup-card') ? 'grid' : 'block'; card.style.visibility = 'visible'; card.style.opacity = '1'; }
    setTimeout(function(){ var u = document.getElementById('loginUser'); if(u) u.focus(); }, 100);
    return true;
  }
  function ensureEmergencyModal(){
    var el = document.getElementById('contaiEmergencyModal');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'contaiEmergencyModal';
    el.innerHTML = '<div class="cebox"><button type="button" class="ceclose">×</button><h2>Acesso ao sistema</h2><p>Informe o e-mail e a senha cadastrados no Supabase.</p><label>E-mail</label><input id="ceEmergencyEmail" autocomplete="username" placeholder="marcoswilc@gmail.com"><label>Senha</label><input id="ceEmergencyPass" type="password" autocomplete="current-password" placeholder="Digite sua senha"><button id="ceEmergencySubmit" type="button">Entrar</button><div id="ceEmergencyMsg"></div></div>';
    var css = document.createElement('style');
    css.id = 'contaiEmergencyCss';
    css.textContent = '#contaiEmergencyLoginBtn{position:fixed;right:22px;bottom:22px;z-index:2147483647;border:0;border-radius:999px;background:#0078d4;color:#fff;padding:14px 20px;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:800;box-shadow:0 18px 45px rgba(0,0,0,.28);cursor:pointer}#contaiEmergencyModal{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.68);backdrop-filter:blur(8px);font-family:Segoe UI,Arial,sans-serif}.cebox{width:min(420px,calc(100vw - 32px));background:#fff;border-radius:22px;padding:26px;box-shadow:0 30px 90px rgba(0,0,0,.36);position:relative}.cebox h2{margin:0 0 6px;color:#111827}.cebox p{margin:0 0 18px;color:#667085}.cebox label{display:block;margin:12px 0 6px;font-size:12px;font-weight:800;color:#475467;text-transform:uppercase}.cebox input{width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;font-size:14px}.cebox #ceEmergencySubmit{width:100%;height:44px;margin-top:18px;border:0;border-radius:12px;background:#0078d4;color:#fff;font-weight:900;cursor:pointer}.ceclose{position:absolute;right:14px;top:12px;border:0;background:transparent;font-size:28px;color:#64748b;cursor:pointer}#ceEmergencyMsg{margin-top:12px;color:#b42318;font-size:13px;min-height:18px}';
    document.head.appendChild(css);
    document.body.appendChild(el);
    el.querySelector('.ceclose').onclick = function(){ el.style.display = 'none'; };
    el.addEventListener('click', function(ev){ if(ev.target === el) el.style.display = 'none'; });
    el.querySelector('#ceEmergencySubmit').onclick = emergencySubmit;
    return el;
  }
  async function emergencySubmit(){
    var msg = document.getElementById('ceEmergencyMsg');
    var email = (document.getElementById('ceEmergencyEmail') || {}).value || '';
    var pass = (document.getElementById('ceEmergencyPass') || {}).value || '';
    if(msg) msg.textContent = 'Validando acesso...';
    try{
      var sess = null;
      if(typeof window.autenticarLoginLocal === 'function') sess = await window.autenticarLoginLocal(email, pass);
      if(!sess && window.supabase && window.supabase.createClient){
        var client = window.supabase.createClient(SUPA_URL, SUPA_KEY);
        var r = await client.auth.signInWithPassword({email: email, password: pass});
        if(!r.error && r.data && r.data.user) sess = {usuario: r.data.user.email, email: r.data.user.email, perfil:'platform_admin', supabaseUserId:r.data.user.id, supabaseSession:r.data.session};
      }
      if(!sess){ if(msg) msg.textContent = 'E-mail ou senha inválidos.'; return; }
      try{ sessionStorage.setItem('controle_empresa_login_v1', JSON.stringify(Object.assign({}, sess, {ts:Date.now()}))); }catch(e){}
      var modal = document.getElementById('contaiEmergencyModal'); if(modal) modal.style.display = 'none';
      if(typeof window.liberarAcessoModulo === 'function') window.liberarAcessoModulo(sess, false);
      else {
        document.body.classList.add('is-authenticated');
        var landing = document.getElementById('landingPage'); if(landing) landing.style.display='none';
        var app = document.getElementById('app'); if(app){ app.classList.remove('app-locked'); app.style.display='grid'; }
        if(typeof window.boot === 'function') window.boot();
      }
    }catch(e){ console.error(e); if(msg) msg.textContent = 'Erro ao validar. Veja o console do navegador.'; }
  }
  function openAnyLogin(sourceEl){
    if(forceShowNativePopup(sourceEl)) return;
    var modal = ensureEmergencyModal();
    modal.style.display = 'flex';
    setTimeout(function(){ var u = document.getElementById('ceEmergencyEmail'); if(u) u.focus(); }, 80);
  }
  onReady(function(){
    if(!document.getElementById('contaiEmergencyLoginBtn')){
      var btn = document.createElement('button');
      btn.id = 'contaiEmergencyLoginBtn';
      btn.type = 'button';
      btn.textContent = 'Entrar';
      btn.onclick = function(){ openAnyLogin(btn); };
      document.body.appendChild(btn);
    }
    document.addEventListener('click', function(ev){
      var t = ev.target && ev.target.closest ? ev.target.closest('button,a') : null;
      if(!t || t.id === 'contaiEmergencyLoginBtn') return;
      var txt = (t.textContent || '').toLowerCase();
      if(txt.indexOf('login') >= 0 || txt.indexOf('entrar') >= 0 || txt.indexOf('senha') >= 0){ ev.preventDefault(); openAnyLogin(t); }
    }, true);
  });
})();
<\/script>`;

if (!html.includes('contai-emergency-login')) {
  html = html.replace('</body></html>', `${emergencyLogin}\n</body></html>`);
  changed = true;
  console.log('[fix-index] adicionado login emergencial fixo');
}

if (changed) {
  fs.writeFileSync(file, html, 'utf8');
  console.log('[fix-index] index.html atualizado para build');
} else {
  console.log('[fix-index] nenhuma alteração necessária');
}
