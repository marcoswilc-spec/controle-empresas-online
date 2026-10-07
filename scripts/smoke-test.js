import fs from 'node:fs';
import path from 'node:path';

const required = [
  'server.js',
  'index.html',
  'public/index.html',
  'public/app.html'
];

for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`Arquivo obrigatório ausente: ${file}`);
    process.exit(1);
  }
}

const finalHtml = fs.readFileSync('index.html', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');

const checks = [
  [finalHtml.includes('Controle de Empresa | Obrigações e Solicitações'), 'HTML final precisa manter o título correto'],
  [finalHtml.includes('id="loginForm"'), 'HTML final precisa manter formulário de login'],
  [finalHtml.includes('ADMIN_HASH_SHA256'), 'HTML final precisa manter login admin protegido por hash'],
  [finalHtml.includes('id="app"'), 'HTML final precisa manter o app interno'],
  [finalHtml.includes('landing-page'), 'HTML final precisa manter página de apresentação'],
  [finalHtml.includes('view-dashboard'), 'HTML final precisa manter dashboard'],
  [finalHtml.includes('view-empresas'), 'HTML final precisa manter empresas'],
  [finalHtml.includes('view-clientes'), 'HTML final precisa manter área do cliente'],
  [server.includes('renderLegacyHtml'), 'Servidor precisa servir o HTML final da raiz'],
  [server.includes('emitLevePromo'), 'Servidor precisa injetar popup do EmitLeve'],
  [server.includes('/api/health'), 'Servidor precisa manter rota de saúde']
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, msg] of failed) console.error('Falha:', msg);
  process.exit(1);
}

console.log('Smoke tests OK: HTML final, login local, landing, app interno e popup EmitLeve presentes.');
