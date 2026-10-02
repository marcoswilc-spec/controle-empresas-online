import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let appHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Correções leves no HTML completo, sem deixar o Vite reinterpretar templates internos.
appHtml = appHtml.replace(
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">',
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script>'
);
appHtml = appHtml.replace(/\n<script id="contai-emergency-login">[\s\S]*?<\/script>\n(?=<\/body><\/html>)/g, '\n');
appHtml = appHtml.replace(/\n<script src="\/login-fix\.js"><\/script>\n?/g, '\n');

const guard = `<script>
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
if (!appHtml.includes('controle_empresa_login_v1')) {
  appHtml = appHtml.replace('<head>', '<head>\n' + guard);
} else if (!appHtml.includes("location.replace('/')")) {
  appHtml = appHtml.replace('<head>', '<head>\n' + guard);
}
fs.writeFileSync(path.join(dist, 'app.html'), appHtml, 'utf8');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qnqmmrvhqxpenhqyesbc.supabase.co';
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || '';

const landing = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cont.AI | Controle de Empresa</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#11161d;color:#fff;overflow-x:hidden}.page{min-height:100vh;background:radial-gradient(circle at 85% 12%,rgba(133,44,52,.42),transparent 34%),linear-gradient(135deg,#11161d 0%,#181d24 52%,#100f13 100%)}.nav{position:sticky;top:0;z-index:20;height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 44px;background:rgba(12,15,20,.82);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08)}.brand{display:flex;align-items:center;gap:14px}.logo{width:48px;height:48px;border-radius:18px;background:linear-gradient(135deg,#1f2937,#475569);display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 20px 50px rgba(0,0,0,.35)}.brand strong{display:block;font-size:18px}.brand span{display:block;font-size:12px;color:#cbd5e1;margin-top:2px}.navlinks{display:flex;align-items:center;gap:28px}.navlinks a{color:#e5e7eb;text-decoration:none;font-size:13px;font-weight:700}.login-pill{display:inline-flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,.35);background:#fff;color:#3a1c1d;border-radius:999px;padding:8px 18px 8px 8px;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.18)}.login-pill span{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#8b2e35,#b85d66);color:#fff}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:42px;align-items:center;min-height:calc(100vh - 68px);padding:64px 48px 54px;max-width:1440px;margin:0 auto}.eyebrow{font-size:13px;font-weight:900;letter-spacing:.18em;color:#aab4c3;text-transform:uppercase}.hero h1{font-size:clamp(44px,5.2vw,82px);line-height:.98;margin:24px 0 22px;letter-spacing:-.065em}.hero p{font-size:17px;line-height:1.75;color:#d3dae5;max-width:720px}.cta{display:flex;gap:14px;flex-wrap:wrap;margin-top:30px}.btn{height:48px;border-radius:999px;padding:0 24px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font-weight:900;cursor:pointer}.btn.primary{background:#c92020;border-color:#c92020}.btn.light{background:rgba(255,255,255,.08)}.mock{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:22px;background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.06));box-shadow:0 50px 120px rgba(0,0,0,.38)}.window{border-radius:24px;background:linear-gradient(135deg,#e5e7eb,#475569);height:350px;position:relative;overflow:hidden;padding:22px}.dots{display:flex;gap:9px}.dots i{width:11px;height:11px;border-radius:50%;background:#64748b}.dots i:nth-child(3){background:#dc2626}.glass{position:absolute;left:36px;top:78px;width:190px;border-radius:18px;background:#fff;color:#111827;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.18)}.glass small{display:block;color:#94a3b8;font-weight:900;letter-spacing:.12em}.glass strong{display:block;font-size:34px;margin-top:8px}.bar{position:absolute;left:36px;right:36px;bottom:42px;height:92px;border-radius:24px;background:rgba(255,255,255,.92)}.mini{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.card{background:rgba(255,255,255,.92);color:#111827;border-radius:20px;padding:20px}.card small{display:block;color:#667085;font-weight:900;letter-spacing:.08em}.card strong{display:block;font-size:30px;margin-top:8px}.section{padding:78px 48px;max-width:1240px;margin:0 auto}.section h2{font-size:42px;margin:0 0 14px;letter-spacing:-.035em}.section>p{color:#cbd5e1;line-height:1.7;max-width:760px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.feature{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:24px;padding:24px}.feature b{display:block;font-size:18px;margin-bottom:8px}.feature p{font-size:14px;color:#cbd5e1;line-height:1.6}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.plan{border-radius:24px;padding:26px;background:#fff;color:#111827}.plan.dark{background:#1f2937;color:#fff;border:1px solid rgba(255,255,255,.16)}.plan strong{font-size:34px}.modal{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.72);backdrop-filter:blur(10px);padding:22px}.modal.open{display:flex}.login-card{width:min(430px,100%);background:#fff;color:#111827;border-radius:28px;padding:30px;box-shadow:0 40px 140px rgba(0,0,0,.45);position:relative}.close{position:absolute;right:18px;top:14px;border:0;background:transparent;font-size:30px;color:#64748b;cursor:pointer}.login-card h2{margin:0 0 8px;font-size:28px}.login-card p{margin:0 0 22px;color:#667085;line-height:1.5}.field{margin:14px 0}.field label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:900;margin-bottom:6px}.field input{width:100%;height:46px;border:1px solid #cbd5e1;border-radius:14px;padding:0 13px;font-size:15px}.login-card button.submit{width:100%;height:48px;border:0;border-radius:14px;background:#0078d4;color:#fff;font-weight:900;cursor:pointer;margin-top:10px}.msg{min-height:20px;margin-top:12px;font-size:13px;color:#b42318}.ok{color:#107c10}@media(max-width:900px){.nav{padding:0 18px}.navlinks a{display:none}.hero{grid-template-columns:1fr;padding:42px 22px}.features,.plans{grid-template-columns:1fr}.section{padding:54px 22px}.mock{display:none}}
</style>
</head>
<body>
<div class="page">
<header class="nav">
  <div class="brand"><div class="logo">CE</div><div><strong>Cont.AI</strong><span>Controle de empresas para escritórios contábeis</span></div></div>
  <nav class="navlinks"><a href="#funcionalidades">Funcionalidades</a><a href="#cliente">Área do cliente</a><a href="#planos">Planos</a><button class="login-pill" data-login><span>↗</span>Faça seu login aqui</button></nav>
</header>
<main>
<section class="hero">
  <div><div class="eyebrow">Sistema de gestão contábil</div><h1>Organize empresas, obrigações, documentos e prazos em um único painel.</h1><p>O Cont.AI foi pensado para a rotina de escritórios contábeis: controle de competências, alertas de vencimento, tarefas por responsável, documentos dos clientes e relatórios de acompanhamento.</p><div class="cta"><button class="btn primary" data-login>Faça seu login aqui</button><a class="btn light" href="#funcionalidades" style="display:inline-flex;align-items:center;text-decoration:none">Ver funcionalidades</a></div></div>
  <div><div class="mock"><div class="window"><div class="dots"><i></i><i></i><i></i></div><div class="glass"><small>PRODUTIVIDADE</small><strong>74%</strong><span>competência em andamento</span></div><div class="bar"></div></div><div class="mini"><div class="card"><small>PENDÊNCIAS</small><strong>27</strong><span>exigem acompanhamento</span></div><div class="card"><small>EMPRESAS</small><strong>128</strong><span>em carteira</span></div></div></div></div>
</section>
<section class="section" id="funcionalidades"><h2>Funcionalidades principais</h2><p>Uma base única para acompanhar rotina fiscal, contábil, trabalhista e societária, reduzindo retrabalho e dependência de planilhas soltas.</p><div class="features"><div class="feature"><b>Empresas e responsáveis</b><p>Cadastro com regime, atividade, código interno, bloqueio, contatos e responsáveis por área.</p></div><div class="feature"><b>Obrigações e competências</b><p>Controle mensal, checklist, progresso, prazos e liberação da próxima competência somente quando estiver pronta.</p></div><div class="feature"><b>Alertas e calendário</b><p>Visão de vencimentos, atrasos, próximas obrigações e alertas com sino para não deixar prazo passar.</p></div><div class="feature"><b>Documentos</b><p>Organização por empresa, categoria, competência e histórico de arquivos enviados ou recebidos.</p></div><div class="feature"><b>Relatórios</b><p>Relatórios por empresa, pendências, concluídas, sem responsabilidade anterior e acompanhamento do time.</p></div><div class="feature"><b>Área do cliente</b><p>Estrutura para cliente visualizar solicitações, enviar documentos e acompanhar pendências de forma simples.</p></div></div></section>
<section class="section" id="cliente"><h2>Área do cliente</h2><p>O objetivo é reduzir mensagens espalhadas e centralizar o que o cliente precisa entregar, o que está pendente e o que já foi concluído.</p></section>
<section class="section" id="planos"><h2>Planos</h2><p>Modelo pensado para escritórios pequenos e médios, com base mensal e cobrança por usuários adicionais.</p><div class="plans"><div class="plan"><h3>Base</h3><strong>R$ 89,90</strong><p>1 usuário incluso e empresas ilimitadas.</p></div><div class="plan dark"><h3>Usuário extra</h3><strong>R$ 39,90</strong><p>Por usuário adicional da equipe.</p></div><div class="plan"><h3>Implantação</h3><strong>sob análise</strong><p>Configuração, importação e treinamento.</p></div></div></section>
</main>
</div>
<div class="modal" id="loginModal"><div class="login-card"><button class="close" id="closeLogin">×</button><h2>Acesso ao sistema</h2><p>Entre com o e-mail e a senha cadastrados no Supabase.</p><div class="field"><label>E-mail</label><input id="email" autocomplete="username" placeholder="marcoswilc@gmail.com"></div><div class="field"><label>Senha</label><input id="password" type="password" autocomplete="current-password" placeholder="Digite sua senha"></div><button class="submit" id="submitLogin">Entrar</button><div class="msg" id="loginMsg"></div></div></div>
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
console.log('[build-static] dist/index.html landing criada');
console.log('[build-static] dist/app.html sistema completo criado');
