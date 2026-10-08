import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '2mb' }));

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
    var opened=false;
    var obs=new MutationObserver(function(){
      if(!opened && document.body.classList.contains('is-authenticated')){
        opened=true;
        setTimeout(window.ceOpenEmitLevePromo,700);
      }
    });
    obs.observe(document.body,{attributes:true,attributeFilter:['class']});
  });
})();
</script>`;

function renderLegacyHtml() {
  const filePath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('ceEmitLeveStyle')) html = html.replace('</head>', `${emitLeveStyle}\n</head>`);
  if (!html.includes('ceEmitLeveScript')) html = html.replace('</body>', `${emitLeveHtml}\n${emitLeveScript}\n</body>`);
  return html;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'legacy-html-final-stable', timestamp: new Date().toISOString() }));
app.get(['/','/app','/app.html','/demo'], (_req, res) => res.type('html').send(renderLegacyHtml()));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.type('html').send(renderLegacyHtml()));

app.listen(PORT, () => console.log(`Controle de Empresa rodando na porta ${PORT} - site final estável em index.html`));
