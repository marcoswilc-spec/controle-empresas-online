import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'dist', 'app.html');
if (!fs.existsSync(file)) {
  console.log('[remove-app-redirect] app.html não encontrado');
  process.exit(0);
}
let html = fs.readFileSync(file, 'utf8');
const before = html.length;
html = html.replace(/<script>\(function\(\)\{try\{if\([^<]*?location\.replace\('\/'\);\}catch\(e\)\{location\.replace\('\/'\);\}\}\)\(\);<\/script>/g, '');
if (html.length !== before) {
  fs.writeFileSync(file, html, 'utf8');
  console.log('[remove-app-redirect] redirecionamento inicial removido');
} else {
  console.log('[remove-app-redirect] nada para remover');
}
