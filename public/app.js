const state = { user:null, organization:null, companies:[], obligations:[], tasks:[], contacts:[] };
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const viewTitles = {
  dashboard:'Dashboard', empresas:'Empresas', obrigacoes:'Obrigações', tarefas:'Pendências', calendario:'Calendário',
  cliente:'Área do cliente', contatos:'Agenda / Contatos', documentos:'Documentos', relatorios:'Relatórios', creditos:'Créditos', usuarios:'Usuários'
};

async function api(path, options={}){
  const res = await fetch(path, { headers:{'Content-Type':'application/json'}, ...options });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || 'Erro na requisição.');
  return data;
}
function showView(id){
  $$('.view').forEach(v=>v.classList.remove('active'));
  $$('.nav-item').forEach(b=>b.classList.remove('active'));
  $('#view-'+id)?.classList.add('active');
  document.querySelector(`[data-view="${id}"]`)?.classList.add('active');
  $('#viewTitle').textContent = viewTitles[id] || 'Painel';
}
function card(title, meta, body, action='') { return `<article class="data-card"><strong>${title}</strong><span>${meta || ''}</span><p>${body || ''}</p>${action}</article>`; }
function render(){
  $('#orgName').textContent = state.organization?.name || 'Organização';
  $('#userBadge').textContent = state.user ? `${state.user.name} · ${state.user.role}` : 'Sem usuário';
  $('#kpiCompanies').textContent = state.companies.length;
  $('#kpiObligations').textContent = state.obligations.filter(o=>o.active !== false).length;
  $('#kpiTasks').textContent = state.tasks.filter(t=>t.status !== 'done').length;
  $('#kpiCredits').textContent = Number(state.organization?.credits_balance || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const exp = state.organization?.credits_expires_at ? new Date(state.organization.credits_expires_at).toLocaleDateString('pt-BR') : 'sem validade registrada';
  $('#nextActions').innerHTML = `<b>Créditos válidos até ${exp}</b><p>Pendências abertas: ${state.tasks.filter(t=>t.status !== 'done').length}. Empresas ativas: ${state.companies.length}. Obrigações cadastradas: ${state.obligations.length}.</p>`;
  $('#companiesList').innerHTML = state.companies.map(c=>card(c.legal_name, `${c.tax_regime || ''} · ${c.internal_code || ''}`, `${c.cnpj || 'sem CNPJ'} ${c.blocked ? '· bloqueada' : ''}`)).join('') || '<div class="empty">Nenhuma empresa cadastrada.</div>';
  $('#obligationsList').innerHTML = state.obligations.map(o=>card(o.name, `${o.area} · ${o.frequency}`, o.due_day ? `Vencimento dia ${o.due_day}` : 'Sem dia fixo')).join('') || '<div class="empty">Nenhuma obrigação cadastrada.</div>';
  $('#tasksList').innerHTML = state.tasks.map(t=>card(t.title, `${t.competence} · ${t.status}`, `Responsável: ${t.responsible || 'não definido'}`, `<button class="secondary small" onclick="toggleTask('${t.id}')">${t.status === 'done' ? 'Reabrir' : 'Concluir'}</button>`)).join('') || '<div class="empty">Nenhuma pendência cadastrada.</div>';
  $('#taskCompany').innerHTML = state.companies.map(c=>`<option value="${c.id}">${c.legal_name}</option>`).join('');
  $('#taskObligation').innerHTML = '<option value="">Sem obrigação vinculada</option>' + state.obligations.map(o=>`<option value="${o.id}">${o.name}</option>`).join('');
  $('#reportBox').innerHTML = `<div class="report-grid"><div><b>${state.companies.length}</b><span>empresas</span></div><div><b>${state.tasks.filter(t=>t.status !== 'done').length}</b><span>pendentes</span></div><div><b>${state.tasks.filter(t=>t.status === 'done').length}</b><span>concluídas</span></div><div><b>${state.obligations.length}</b><span>obrigações</span></div></div>`;
}
async function load(){
  try{
    const me = await api('/api/me');
    state.user = me.user; state.organization = me.organization;
    if(me.databaseMode === 'demo-memory'){ const n=$('#modeNotice'); n.hidden=false; n.textContent='Modo demonstração: dados temporários até conectar DATABASE_URL do Render Postgres.'; }
    const boot = await api('/api/bootstrap');
    Object.assign(state, boot);
    render();
  }catch(err){ location.href='/?login=1'; }
}
async function submitForm(form, endpoint){
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  await api(endpoint, { method:'POST', body: JSON.stringify(payload) });
  form.reset();
  await load();
}
window.toggleTask = async (id)=>{ await api(`/api/tasks/${id}/toggle`, { method:'PATCH' }); await load(); };
$$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
$$('[data-view-shortcut]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.viewShortcut)));
$('#refreshBtn')?.addEventListener('click', load);
$('#quickRefresh')?.addEventListener('click', load);
$('#logoutBtn')?.addEventListener('click', async()=>{ await api('/api/auth/logout', { method:'POST' }); location.href='/'; });
$('#companyForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm(e.currentTarget, '/api/companies').catch(err=>alert(err.message)); });
$('#obligationForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm(e.currentTarget, '/api/obligations').catch(err=>alert(err.message)); });
$('#taskForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm(e.currentTarget, '/api/tasks').catch(err=>alert(err.message)); });
$('#creditForm')?.addEventListener('submit', async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); try{ const r=await api('/api/billing/checkout',{method:'POST',body:JSON.stringify({amount:fd.get('amount')})}); $('#creditMessage').textContent = r.checkout_url ? 'Pagamento gerado.' : JSON.stringify(r); }catch(err){ $('#creditMessage').textContent=err.message; }});
load();
