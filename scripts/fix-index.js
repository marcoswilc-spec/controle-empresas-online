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
// Isso quebra o JavaScript principal e impede o login/modal de abrir.
const brokenPrint = 'w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Calendário de Obrigações</title><style>@page{size:A4;margin:12mm}body{font-family:\'Calibri Light\',Calibri,Arial,sans-serif;color:#172033;font-size:11px}h1{font-size:20px;margin:0 0 4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #e5e7eb;padding:6px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Calendário de Obrigações</h1><p>Competência ${escapeHtml(comp)} • gerado em ${new Date().toLocaleString("pt-BR")}</p><table><thead><tr><th>Prazo</th><th>Empresa</th><th>Obrigação</th><th>Status</th><th>Responsável</th></tr></thead><tbody>${rows || \'<tr><td colspan="5">Nenhuma obrigação com prazo.</td></tr>\'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),200)<\\/script>\n<script>';

const fixedPrint = 'w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Calendário de Obrigações</title><style>@page{size:A4;margin:12mm}body{font-family:\'Calibri Light\',Calibri,Arial,sans-serif;color:#172033;font-size:11px}h1{font-size:20px;margin:0 0 4px}p{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #e5e7eb;padding:6px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Calendário de Obrigações</h1><p>Competência ${escapeHtml(comp)} • gerado em ${new Date().toLocaleString("pt-BR")}</p><table><thead><tr><th>Prazo</th><th>Empresa</th><th>Obrigação</th><th>Status</th><th>Responsável</th></tr></thead><tbody>${rows || \'<tr><td colspan="5">Nenhuma obrigação com prazo.</td></tr>\'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),200)<\\/script></body></html>`);\n  w.document.close();\n}\n\n\n<script>';

replaceOnce(brokenPrint, fixedPrint, 'impressão calendário / script fora do lugar');

// Correção 3: se a correção anterior deixou fechamento duplicado no final, remove o bloco quebrado.
replaceOnce(
  '</script>\n\n</body></html>`);\n  w.document.close();\n}\n\nfunction renderKpi(k){',
  'function renderKpi(k){',
  'fechamento duplicado após patch online'
);

// Fallback defensivo: garante que o botão de login abra o popup mesmo se o onclick falhar.
const fallback = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const buttons = Array.from(document.querySelectorAll('button, a'));
  buttons.forEach((el) => {
    const txt = (el.textContent || '').toLowerCase();
    if (txt.includes('login') || txt.includes('entrar') || txt.includes('senha')) {
      el.addEventListener('click', (ev) => {
        if (typeof window.abrirLoginPopup === 'function') {
          ev.preventDefault();
          window.abrirLoginPopup(el);
        }
      });
    }
  });
});
</script>`;

if (!html.includes("Fallback defensivo") && !html.includes("window.addEventListener('DOMContentLoaded', () => {\n  const buttons")) {
  html = html.replace('</body></html>', `${fallback}\n</body></html>`);
  changed = true;
  console.log('[fix-index] adicionado fallback de abertura do login');
}

if (changed) {
  fs.writeFileSync(file, html, 'utf8');
  console.log('[fix-index] index.html atualizado para build');
} else {
  console.log('[fix-index] nenhuma alteração necessária');
}
