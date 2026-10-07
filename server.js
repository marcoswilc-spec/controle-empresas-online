import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '2mb' }));

const emitLeveCss = `
<style id="emitLevePromoStyle">
.emit-promo-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,.62);backdrop-filter:blur(8px);z-index:4500}.emit-promo-overlay.open{display:flex}.emit-promo-wrap{position:relative;width:min(760px,100%)}.emit-promo-card{width:100%;background:linear-gradient(145deg,rgba(8,14,25,.96),rgba(24,32,50,.96));color:#f5f7fb;border:1px solid rgba(255,255,255,.12);border-radius:26px;overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.42);display:grid;grid-template-columns:1.06fr .94fr}.emit-promo-main{padding:28px 28px 24px}.emit-promo-side{background:linear-gradient(160deg,rgba(180,25,25,.18),rgba(255,255,255,.04));border-left:1px solid rgba(255,255,255,.08);padding:28px 24px;display:flex;flex-direction:column;justify-content:space-between;gap:18px}.emit-badge{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.emit-badge-mark{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#cf2f1d,#8d1212);color:#fff;font-weight:800;box-shadow:0 8px 20px rgba(207,47,29,.28)}.emit-promo-title{margin:16px 0 10px;font-size:34px;line-height:1.08;font-weight:800}.emit-promo-text{margin:0 0 20px;color:rgba(241,245,249,.82);font-size:15px;line-height:1.7}.emit-promo-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}.emit-promo-list li{display:flex;gap:12px;align-items:flex-start;color:rgba(241,245,249,.92);font-size:14px;line-height:1.5}.emit-promo-dot{width:10px;height:10px;border-radius:999px;margin-top:6px;background:#cf2f1d;box-shadow:0 0 0 6px rgba(207,47,29,.12);flex:0 0 auto}.emit-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.emit-stat{padding:16px 14px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.07)}.emit-stat strong{display:block;font-size:24px;line-height:1;margin-bottom:6px;color:#fff}.emit-stat span{font-size:12px;color:rgba(241,245,249,.74)}.emit-credit-box{padding:16px;border-radius:20px;background:linear-gradient(135deg,rgba(207,47,29,.22),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.08);color:#fff}.emit-credit-box strong{display:block;margin-bottom:8px;font-size:15px}.emit-credit-box p{margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,.86)}.emit-promo-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.emit-btn{appearance:none;border:0;border-radius:16px;padding:13px 18px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;transition:transform .16s ease,box-shadow .16s ease,opacity .16s ease}.emit-btn:hover{transform:translateY(-1px)}.emit-btn.primary{background:linear-gradient(135deg,#cf2f1d,#a51616);color:#fff;box-shadow:0 12px 28px rgba(207,47,29,.26)}.emit-btn.ghost{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.1)}.emit-close{position:absolute;top:16px;right:16px;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font-size:18px;cursor:pointer;z-index:2}@media(max-width:880px){.emit-promo-card{grid-template-columns:1fr}.emit-promo-side{border-left:0;border-top:1px solid rgba(255,255,255,.08)}}@media(max-width:640px){.emit-promo-overlay{padding:16px}.emit-promo-main,.emit-promo-side{padding:22px 18px}.emit-promo-title{font-size:28px}.emit-promo-actions{flex-direction:column}.emit-btn{width:100%;text-align:center}}
</style>
`;

const emitLeveHtml = `
<div class="emit-promo-overlay" id="emitLevePromo" aria-hidden="true">
  <div class="emit-promo-wrap">
    <button type="button" class="emit-close" id="emitLevePromoClose" aria-label="Fechar anúncio do EmitLeve">✕</button>
    <div class="emit-promo-card">
      <div class="emit-promo-main">
        <div class="emit-badge"><span class="emit-badge-mark">EL</span> Destaque do ecossistema</div>
        <h3 class="emit-promo-title">Conheça o EmitLeve</h3>
        <p class="emit-promo-text">Emissão prática de NFSe com fluxo pensado para o contador: onboarding guiado, envio por WhatsApp, importação de XML/PDF, compra de créditos e acompanhamento do cliente em um único lugar.</p>
        <ul class="emit-promo-list">
          <li><span class="emit-promo-dot"></span><span>Compra de créditos com validade de <strong>30 dias</strong>, ideal para clientes com emissão sob demanda.</span></li>
          <li><span class="emit-promo-dot"></span><span>Integração com cobrança para automatizar a liberação de créditos e acompanhar pagamentos.</span></li>
          <li><span class="emit-promo-dot"></span><span>Experiência simples para o cliente e controle operacional mais claro para o escritório.</span></li>
        </ul>
        <div class="emit-promo-actions">
          <a class="emit-btn primary" href="https://emitleve.com.br" target="_blank" rel="noopener noreferrer">Quero conhecer o EmitLeve</a>
          <button type="button" class="emit-btn ghost" id="emitLevePromoLater">Lembrar depois</button>
        </div>
      </div>
      <div class="emit-promo-side">
        <div class="emit-stat-grid">
          <div class="emit-stat"><strong>NFSe</strong><span>Emissão simplificada com foco em serviço</span></div>
          <div class="emit-stat"><strong>WhatsApp</strong><span>Relacionamento mais humano com o cliente</span></div>
          <div class="emit-stat"><strong>XML/PDF</strong><span>Importação para reduzir digitação manual</span></div>
          <div class="emit-stat"><strong>Créditos</strong><span>Recarga sob demanda e uso controlado</span></div>
        </div>
        <div class="emit-credit-box"><strong>Oferta combinada para o escritório</strong><p>Use o Controle de Empresa para organizar a operação e apresente o EmitLeve como extensão comercial para clientes que precisam emitir notas com praticidade.</p></div>
      </div>
    </div>
  </div>
</div>
`;

const emitLeveJs = `
<script id="emitLevePromoScript">
(function(){
  const KEY = 'controle_empresa_emitLeve_promo_v1';
  function open(){ const el=document.getElementById('emitLevePromo'); if(el){ el.classList.add('open'); el.setAttribute('aria-hidden','false'); } }
  function close(mark){ const el=document.getElementById('emitLevePromo'); if(el){ el.classList.remove('open'); el.setAttribute('aria-hidden','true'); } if(mark){ try{ sessionStorage.setItem(KEY,'1'); }catch(e){} } }
  function shouldOpen(){ try{ return sessionStorage.getItem(KEY) !== '1'; }catch(e){ return true; } }
  function bind(){
    document.getElementById('emitLevePromoClose')?.addEventListener('click',()=>close(true));
    document.getElementById('emitLevePromoLater')?.addEventListener('click',()=>close(true));
    document.getElementById('emitLevePromo')?.addEventListener('click',e=>{ if(e.target && e.target.id === 'emitLevePromo') close(true); });
  }
  document.addEventListener('DOMContentLoaded', function(){
    bind();
    const obs = new MutationObserver(function(){
      if(document.body.classList.contains('is-authenticated') && shouldOpen()){
        setTimeout(open, 900);
        obs.disconnect();
      }
    });
    obs.observe(document.body,{attributes:true,attributeFilter:['class']});
    if(document.body.classList.contains('is-authenticated') && shouldOpen()) setTimeout(open, 900);
  });
})();
</script>
`;

function renderLegacyHtml() {
  const filePath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('emitLevePromoStyle')) html = html.replace('</head>', `${emitLeveCss}\n</head>`);
  if (!html.includes('emitLevePromo"')) html = html.replace('</body>', `${emitLeveHtml}\n${emitLeveJs}\n</body>`);
  return html;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'legacy-html-final', source: 'index.html', timestamp: new Date().toISOString() });
});

app.get(['/','/app','/app.html','/demo'], (_req, res) => {
  res.type('html').send(renderLegacyHtml());
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.type('html').send(renderLegacyHtml()));

app.listen(PORT, () => console.log(`Controle de Empresa rodando na porta ${PORT} - site final em index.html`));
