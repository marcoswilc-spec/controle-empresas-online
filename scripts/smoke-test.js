import fs from 'node:fs';
import path from 'node:path';

const required = [
  'server.js',
  'db/schema.sql',
  'public/index.html',
  'public/app.html',
  'public/site.js',
  'public/app.js',
  'public/styles.css'
];

for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`Arquivo obrigatório ausente: ${file}`);
    process.exit(1);
  }
}

const landing = fs.readFileSync('public/index.html', 'utf8');
const app = fs.readFileSync('public/app.html', 'utf8');
const css = fs.readFileSync('public/styles.css', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');

const checks = [
  [landing.includes('Entrar como teste'), 'landing precisa ter login de demonstração'],
  [landing.includes('id="loginForm"'), 'landing precisa ter formulário de login'],
  [app.includes('right-actions'), 'app precisa ter ações laterais direitas'],
  [app.includes('view-dashboard'), 'app precisa ter dashboard'],
  [app.includes('view-empresas'), 'app precisa ter empresas'],
  [app.includes('view-creditos'), 'app precisa ter créditos'],
  [css.includes('@media'), 'CSS precisa ter responsividade'],
  [server.includes('/api/auth/login'), 'backend precisa ter rota de login'],
  [server.includes('/api/billing/checkout'), 'backend precisa ter rota de cobrança'],
  [server.includes('DATABASE_URL'), 'backend precisa aceitar Render Postgres']
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, msg] of failed) console.error('Falha:', msg);
  process.exit(1);
}

console.log('Smoke tests OK: estrutura, login, app, responsividade e cobrança básica presentes.');
