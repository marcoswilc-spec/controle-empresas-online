import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let appHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Corrige a tag do Supabase se o HTML completo ainda estiver com script aberto.
appHtml = appHtml.replace(
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">',
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script>'
);

// Remove correções antigas que tentavam forçar login dentro do HTML gigante.
appHtml = appHtml.replace(/\n<script id="contai-emergency-login">[\s\S]*?<\/script>\n(?=<\/body><\/html>)/g, '\n');
appHtml = appHtml.replace(/\n<script src="\/login-fix\.js"><\/script>\n?/g, '\n');
appHtml = appHtml.replace(/\n<script id="contai-app-guard">[\s\S]*?<\/script>\n?/g, '\n');

const appGuard = `<script id="contai-app-guard">
(function(){
  try {
    if (!sessionStorage.getItem('controle_empresa_login_v1')) {
      location.replace('/');
    }
  } catch (e) {
    location.replace('/');
  }
})();
</script>`;
appHtml = appHtml.replace('<head>', '<head>\n' + appGuard);
fs.writeFileSync(path.join(dist, 'app.html'), appHtml, 'utf8');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qnqmmrvhqxpenhqyesbc.supabase.co';
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || '';

const landing = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Controle de Empresa | Cont.AI</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:'Segoe UI Variable','Segoe UI',Arial,sans-serif;background:#0e131b;color:#f8fafc;overflow-x:hidden}button,input{font-family:inherit}.site{min-height:100vh;background:radial-gradient(circle at 84% 8%,rgba(132,38,50,.42),transparent 30%),radial-gradient(circle at 5% 28%,rgba(0,120,212,.22),transparent 26%),linear-gradient(135deg,#0e131b 0%,#151b24 48%,#101015 100%)}.top{position:sticky;top:0;z-index:50;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;background:rgba(10,14,20,.82);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08)}.brand{display:flex;align-items:center;gap:14px}.brand-mark{width:46px;height:46px;border-radius:16px;background:linear-gradient(135deg,#0078d4,#1b2a4a);display:grid;place-items:center;font-weight:950;box-shadow:0 18px 42px rgba(0,0,0,.36)}.brand strong{display:block;font-size:18px;letter-spacing:-.02em}.brand span{display:block;font-size:12px;color:#aab7c8;margin-top:2px}.nav{display:flex;align-items:center;gap:24px}.nav a{color:#e5e7eb;text-decoration:none;font-size:13px;font-weight:750}.loginTop{display:inline-flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.34);background:#fff;color:#221518;border-radius:999px;padding:8px 18px 8px 8px;font-weight:900;cursor:pointer;box-shadow:0 16px 36px rgba(0,0,0,.25)}.loginTop i{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#8b2e35,#c64040);color:#fff;font-style:normal}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:42px;align-items:center;min-height:calc(100vh - 72px);padding:64px 48px 54px;max-width:1420px;margin:0 auto}.tag{display:inline-flex;gap:8px;align-items:center;padding:8px 12px;border:1px solid rgba(255,255,255,.15);border-radius:999px;background:rgba(255,255,255,.06);color:#cbd5e1;font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-size:clamp(42px,5.3vw,82px);line-height:.98;margin:24px 0 22px;letter-spacing:-.07em}.hero p{font-size:17px;line-height:1.75;color:#d5deea;max-width:730px}.actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:32px}.btn{height:48px;border-radius:999px;padding:0 24px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}.btn.primary{background:#c92020;border-color:#c92020;box-shadow:0 18px 36px rgba(201,32,32,.23)}.proof{display:flex;gap:16px;flex-wrap:wrap;margin-top:30px;color:#b8c4d6}.proof span{display:inline-flex;align-items:center;gap:8px;font-size:13px}.proof b{color:#fff}.showcase{border:1px solid rgba(255,255,255,.14);border-radius:34px;padding:22px;background:linear-gradient(145deg,rgba(255,255,255,.15),rgba(255,255,255,.055));box-shadow:0 50px 120px rgba(0,0,0,.42)}.appmock{height:420px;border-radius:26px;background:#eef3f8;color:#111827;overflow:hidden;display:grid;grid-template-columns:108px 1fr;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)}.side{background:#1b2a4a;color:#fff;padding:18px 12px}.side .miniLogo{width:38px;height:38px;border-radius:12px;background:#0078d4;display:grid;place-items:center;font-weight:900;margin-bottom:22px}.side div:not(.miniLogo){height:10px;border-radius:999px;background:rgba(255,255,255,.18);margin:14px 0}.dash{padding:20px;overflow:hidden}.dashTop{display:flex;justify-content:space-between;align-items:center}.dashTop h3{margin:0;font-size:18px}.chip{background:#dbeafe;color:#005a9e;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:850}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.kpi{background:#fff;border:1px solid #dbe3ee;border-radius:16px;padding:16px}.kpi small{color:#64748b;font-weight:850;letter-spacing:.08em}.kpi strong{display:block;font-size:28px;margin-top:7px}.rows{background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:12px}.row{display:grid;grid-template-columns:1.2fr .7fr .7fr;gap:10px;padding:12px;border-bottom:1px solid #edf2f7}.row:last-child{border-bottom:none}.bar{height:10px;background:#e5e7eb;border-radius:999px}.bar.red{background:#fee2e2}.bar.blue{background:#dbeafe}.section{max-width:1240px;margin:0 auto;padding:76px 48px}.sectionHead{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:28px}.section h2{font-size:42px;line-height:1.05;letter-spacing:-.045em;margin:0}.section .lead{color:#cbd5e1;line-height:1.7;max-width:760px;margin:12px 0 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.feature{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:24px;padding:24px;min-height:170px}.feature .ico{width:42px;height:42px;border-radius:14px;background:rgba(0,120,212,.22);display:grid;place-items:center;margin-bottom:16px}.feature b{display:block;font-size:18px;margin-bottom:9px}.feature p{font-size:14px;color:#cbd5e1;line-height:1.6;margin:0}.flow{display:grid;grid-template-columns:1fr 1fr;gap:18px}.panel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);border-radius:26px;padding:28px}.panel h3{margin:0 0 12px;font-size:24px}.panel ul{margin:0;padding-left:18px;color:#d5deea;line-height:1.9}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.plan{background:#fff;color:#111827;border-radius:26px;padding:28px}.plan.dark{background:#1b2a4a;color:#fff;border:1px solid rgba(255,255,255,.13)}.plan h3{margin:0 0 10px}.plan strong{font-size:36px}.plan p{color:#667085;line-height:1.6}.plan.dark p{color:#d8e1ef}.footer{padding:32px 48px;color:#94a3b8;border-top:1px solid rgba(255,255,255,.08);text-align:center}.modal{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.72);backdrop-filter:blur(10px);padding:22px}.modal.open{display:flex}.loginCard{width:min(430px,100%);background:#fff;color:#111827;border-radius:28px;padding:30px;box-shadow:0 40px 140px rgba(0,0,0,.45);position:relative}.close{position:absolute;right:18px;top:14px;border:0;background:transparent;font-size:30px;color:#64748b;cursor:pointer}.loginCard h2{margin:0 0 8px;font-size:28px}.loginCard p{margin:0 0 22px;color:#667085;line-height:1.5}.field{margin:14px 0}.field label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:900;margin-bottom:6px}.field input{width:100%;height:46px;border:1px solid #cbd5e1;border-radius:14px;padding:0 13px;font-size:15px}.submit{width:100%;height:48px;border:0;border-radius:14px;background:#0078d4;color:#fff;font-weight:900;cursor:pointer;margin-top:10px}.msg{min-height:20px;margin-top:12px;font-size:13px;color:#b42318}.ok{color:#107c10}@media(max-width:950px){.top{padding:0 18px}.nav a{display:none}.hero{grid-template-columns:1fr;padding:42px 22px}.showcase{display:none}.section{padding:56px 22px}.sectionHead{display:block}.grid,.flow,.plans{grid-template-columns:1fr}.hero h1{font-size:44px}}
</style>
</head>
<body>
<div class="site">
<header class="top">
  <div class="brand"><div class="brand-mark">CE</div><div><strong>Controle de Empresa</strong><span>Cont.AI • Gestão contábil operacional</span></div></div>
  <nav class="nav"><a href="#modulos">Módulos</a><a href="#cliente">Área do cliente</a><a href="#planos">Planos</a><button class="loginTop" data-login><i>↗</i>Faça seu login aqui</button></nav>
</header>
<main>
<section class="hero">
  <div>
    <div class="tag">Rotina contábil sem planilha solta</div>
    <h1>Controle empresas, obrigações, prazos e documentos em um painel único.</h1>
    <p>Uma central para escritório contábil acompanhar empresas, responsáveis, competências, pendências, calendário fiscal, documentos, área do cliente e relatórios operacionais.</p>
    <div class="actions"><button class="btn primary" data-login>Entrar no sistema</button><a class="btn" href="#modulos">Ver o que o sistema faz</a></div>
    <div class="proof"><span><b>✓</b> Empresas ilimitadas</span><span><b>✓</b> 1 usuário incluso</span><span><b>✓</b> Controle por competência</span></div>
  </div>
  <div class="showcase">
    <div class="appmock">
      <div class="side"><div class="miniLogo">CE</div><div></div><div></div><div></div><div></div><div></div></div>
      <div class="dash"><div class="dashTop"><h3>Dashboard operacional</h3><span class="chip">Competência atual</span></div><div class="kpis"><div class="kpi"><small>EMPRESAS</small><strong>128</strong></div><div class="kpi"><small>PENDÊNCIAS</small><strong>27</strong></div><div class="kpi"><small>PROGRESSO</small><strong>74%</strong></div></div><div class="rows"><div class="row"><b>Empresa A</b><span class="bar blue"></span><span class="bar"></span></div><div class="row"><b>Empresa B</b><span class="bar red"></span><span class="bar blue"></span></div><div class="row"><b>Empresa C</b><span class="bar"></span><span class="bar blue"></span></div><div class="row"><b>Empresa D</b><span class="bar blue"></span><span class="bar red"></span></div></div></div>
    </div>
  </div>
</section>
<section class="section" id="modulos"><div class="sectionHead"><div><h2>O que já tínhamos no sistema</h2><p class="lead">A página voltou a demonstrar os módulos principais que vínhamos montando, mantendo a entrada visual antes do login.</p></div></div><div class="grid">
  <div class="feature"><div class="ico">▦</div><b>Dashboard</b><p>Cards de empresas, pendências, progresso da competência e alertas próximos.</p></div>
  <div class="feature"><div class="ico">⌂</div><b>Cadastro de empresas</b><p>CNPJ, regime, atividade, código interno, responsáveis, contatos e bloqueio.</p></div>
  <div class="feature"><div class="ico">✓</div><b>Fechamento mensal</b><p>Checklist por competência, controle por etapa e avanço para próximo mês.</p></div>
  <div class="feature"><div class="ico">🔔</div><b>Calendário e alertas</b><p>Vencimentos, atrasos, próximos 7 dias e visão de obrigações com sino.</p></div>
  <div class="feature"><div class="ico">📄</div><b>Documentos</b><p>Arquivos por empresa, categoria, competência e histórico de envio.</p></div>
  <div class="feature"><div class="ico">⚑</div><b>Conferência fiscal</b><p>Painel de divergências, empresas sem divergência e ações operacionais.</p></div>
  <div class="feature"><div class="ico">☏</div><b>Agenda e contatos</b><p>Contatos por departamento, modelos de e-mail e acesso rápido ao cliente.</p></div>
  <div class="feature"><div class="ico">ƒ</div><b>Fator R</b><p>Apuração prática com faturamento, folha e indicação operacional de anexo.</p></div>
  <div class="feature"><div class="ico">↗</div><b>Links rápidos</b><p>Receita, Simples, SPED, prefeituras, FGTS Digital e bases de consulta.</p></div>
</div></section>
<section class="section" id="cliente"><div class="flow"><div class="panel"><h3>Área do cliente</h3><ul><li>Solicitações e documentos centralizados.</li><li>Controle do que o cliente enviou e do que falta.</li><li>Menos mensagens espalhadas em WhatsApp/e-mail.</li></ul></div><div class="panel"><h3>Controle interno</h3><ul><li>Usuários, responsáveis e permissões.</li><li>Chamados internos e acompanhamento do time.</li><li>Relatórios para saber feito x faltante.</li></ul></div></div></section>
<section class="section" id="planos"><h2>Planos</h2><p class="lead">Modelo simples para iniciar online e evoluir para automações, pagamento e equipe.</p><div class="plans"><div class="plan"><h3>Base mensal</h3><strong>R$ 89,90</strong><p>1 usuário incluso e cadastro de empresas ilimitado.</p></div><div class="plan dark"><h3>Usuário extra</h3><strong>R$ 39,90</strong><p>Por usuário adicional da equipe do escritório.</p></div><div class="plan"><h3>Implantação</h3><strong>sob análise</strong><p>Importação, parametrização e treinamento inicial.</p></div></div></section>
</main>
<footer class="footer">Controle de Empresa • Cont.AI — gestão operacional para escritório contábil</footer>
</div>
<div class="modal" id="loginModal"><div class="loginCard"><button class="close" id="closeLogin">×</button><h2>Acesso ao sistema</h2><p>Entre com o e-mail e a senha cadastrados.</p><div class="field"><label>E-mail</label><input id="email" autocomplete="username" placeholder="marcoswilc@gmail.com"></div><div class="field"><label>Senha</label><input id="password" type="password" autocomplete="current-password" placeholder="Digite sua senha"></div><button class="submit" id="submitLogin">Entrar</button><div class="msg" id="loginMsg"></div></div></div>
<script>
const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnon)};
const modal = document.getElementById('loginModal');
document.querySelectorAll('[data-login]').forEach(b=>b.addEventListener('click',()=>{modal.classList.add('open');setTimeout(()=>document.getElementById('email').focus(),80)}));
document.getElementById('closeLogin').onclick=()=>modal.classList.remove('open');
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.getElementById('submitLogin').onclick=login;
document.getElementById('password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
async function login(){
  const msg=document.getElementById('loginMsg');
  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value;
  if(!email||!password){msg.textContent='Informe e-mail e senha.';return;}
  if(!SUPABASE_ANON_KEY){msg.textContent='Configuração do Supabase ausente no Render.';return;}
  msg.textContent='Validando acesso...'; msg.className='msg';
  try{
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){msg.textContent='Login não autorizado: '+error.message;return;}
    sessionStorage.setItem('controle_empresa_login_v1', JSON.stringify({email:data.user.email, supabaseUserId:data.user.id, ts:Date.now()}));
    msg.textContent='Acesso liberado. Abrindo sistema...'; msg.className='msg ok';
    location.href='/app.html';
  }catch(err){msg.textContent='Erro ao conectar no Supabase.';console.error(err)}
}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(dist, 'index.html'), landing, 'utf8');
console.log('[build-static] dist/index.html landing restaurada');
console.log('[build-static] dist/app.html sistema completo gerado');
