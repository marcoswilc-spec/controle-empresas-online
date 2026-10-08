import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('./index.html', import.meta.url));
const propaganda = readFileSync(new URL('./assets/emitleve-propaganda.png', import.meta.url));
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  if (path === '/assets/emitleve-propaganda.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': propaganda.length });
    return res.end(req.method === 'HEAD' ? undefined : propaganda);
  }
  if (path === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(req.method === 'HEAD' ? undefined : 'ok');
  }
  if (['/login', '/app', '/logout'].includes(path)) {
    res.writeHead(302, { Location: '/' }); return res.end();
  }
  if (!['/', '/index.html'].includes(path)) {
    res.writeHead(404); return res.end();
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
  res.end(req.method === 'HEAD' ? undefined : html);
});
server.listen(process.env.PORT || 10000, '0.0.0.0');
process.on('SIGTERM', () => server.close());
