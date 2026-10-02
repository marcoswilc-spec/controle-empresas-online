import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
let changed = false;

const css = `
/* ============================================================
   PATCH LAYOUT — AÇÕES NA LATERAL DIREITA
   ============================================================ */
.ce-right-actions{
  position:fixed;
  top:64px;
  right:10px;
  z-index:80;
  width:58px;
  max-height:calc(100vh - 82px);
  overflow:hidden auto;
  display:flex;
  flex-direction:column;
  gap:6px;
  padding:8px 6px;
  background:rgba(255,255,255,.96);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 18px 46px rgba(15,23,42,.16);
  backdrop-filter:blur(10px);
  transition:width .16s ease, box-shadow .16s ease;
}
.ce-right-actions:hover{
  width:158px;
  box-shadow:0 24px 64px rgba(15,23,42,.22);
}
.ce-right-actions .btn{
  width:100%;
  min-height:32px;
  height:32px;
  padding:0 7px;
  justify-content:center;
  overflow:hidden;
  text-overflow:ellipsis;
  border-radius:10px;
  font-size:0;
}
.ce-right-actions:hover .btn{
  justify-content:flex-start;
  font-size:11px;
}
.ce-right-actions .btn::before{
  content:attr(data-ce-icon);
  font-size:14px;
  line-height:1;
}
.ce-right-actions:hover .btn::before{
  margin-right:6px;
  min-width:16px;
  text-align:center;
}
.ce-actions-source:empty,
.ce-actions-source .btn[data-ce-moved="1"]{
  display:none!important;
}
.topbar{
  min-height:48px!important;
  height:48px!important;
  align-items:center!important;
}
.main{
  padding-right:78px!important;
}
@media(max-width:900px){
  .ce-right-actions{top:auto;right:10px;bottom:10px;max-height:42vh;}
  .main{padding-right:18px!important;padding-bottom:96px!important;}
}
`;

const js = `
<script id="ce-right-actions-patch">
(function(){
  const labels = [
    ['Limpar','↺'],['Próximo mês','→'],['Grupos/Obrigações','▦'],['Usuários','👥'],['Relatório','📄'],['Contatos','☏'],
    ['Área do cliente','◎'],['Calendário','📅'],['Links','🔗'],['Backup','↓'],['Restaurar','↑'],['CSV','⇩'],['Imprimir','⎙'],
    ['+ Verificar','✓'],['Verificar','✓'],['Alertas','🔔'],['Sair','⎋']
  ];
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function iconFor(text){
    const t = norm(text);
    const found = labels.find(([label]) => t.includes(label));
    return found ? found[1] : '•';
  }
  function shouldMove(btn){
    const t = norm(btn.textContent);
    if(!t) return false;
    return labels.some(([label]) => t.includes(label));
  }
  function moveActions(){
    let rail = document.getElementById('ceRightActions');
    if(!rail){
      rail = document.createElement('div');
      rail.id = 'ceRightActions';
      rail.className = 'ce-right-actions';
      rail.setAttribute('aria-label','Ações rápidas');
      document.body.appendChild(rail);
    }
    const buttons = Array.from(document.querySelectorAll('button.btn, a.btn, button'))
      .filter(el => !rail.contains(el) && shouldMove(el));
    if(!buttons.length) return;
    buttons.forEach(btn => {
      const src = btn.parentElement;
      if(src) src.classList.add('ce-actions-source');
      const txt = norm(btn.textContent);
      btn.dataset.ceMoved = '1';
      btn.dataset.ceIcon = iconFor(txt);
      btn.title = txt;
      rail.appendChild(btn);
    });
  }
  function boot(){
    moveActions();
    setTimeout(moveActions,300);
    setTimeout(moveActions,900);
    const mo = new MutationObserver(() => moveActions());
    mo.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
</script>`;

if (!html.includes('PATCH LAYOUT — AÇÕES NA LATERAL DIREITA')) {
  html = html.replace('</style>', css + '\n</style>');
  changed = true;
}
if (!html.includes('ce-right-actions-patch')) {
  html = html.replace('</body></html>', js + '\n</body></html>');
  changed = true;
}

if (changed) {
  fs.writeFileSync(file, html, 'utf8');
  console.log('[patch-layout] ações rápidas movidas para lateral direita');
} else {
  console.log('[patch-layout] patch já aplicado');
}
