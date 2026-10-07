const modal = document.getElementById('loginModal');
const message = document.getElementById('loginMessage');
function openLogin(){ modal.hidden = false; modal.classList.add('open'); setTimeout(()=>document.querySelector('[name=email]')?.focus(), 80); }
function closeLogin(){ modal.classList.remove('open'); modal.hidden = true; }
async function doLogin(email, password){
  message.textContent = 'Validando acesso...';
  const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
  const data = await res.json().catch(()=>({}));
  if(!res.ok){ message.textContent = data.error || 'Falha no login.'; return; }
  message.textContent = 'Acesso liberado. Abrindo painel...';
  location.href = '/app';
}
document.querySelectorAll('[data-open-login]').forEach(btn => btn.addEventListener('click', openLogin));
document.querySelectorAll('[data-close-login]').forEach(btn => btn.addEventListener('click', closeLogin));
modal?.addEventListener('mousedown', e => { if(e.target === modal) closeLogin(); });
document.getElementById('loginForm')?.addEventListener('submit', e => { e.preventDefault(); const fd = new FormData(e.currentTarget); doLogin(fd.get('email'), fd.get('password')); });
['demoLogin','demoLogin2','demoLogin3'].forEach(id => document.getElementById(id)?.addEventListener('click', () => doLogin('demo@contai.test','demo123')));
if(new URLSearchParams(location.search).get('demo') === '1') doLogin('demo@contai.test','demo123');
