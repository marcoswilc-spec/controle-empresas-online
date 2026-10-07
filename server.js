import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const hasDatabase = Boolean(process.env.DATABASE_URL);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let pool = null;
const memory = {
  org: {
    id: 'demo-org',
    name: 'Escritório Demonstração',
    slug: 'demo',
    credits_balance: 89.9,
    credits_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'active'
  },
  users: [],
  companies: [],
  obligations: [],
  tasks: [],
  contacts: [],
  payment_orders: [],
  audit_logs: []
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function signToken(user) {
  return jwt.sign({ sub: user.id, organization_id: user.organization_id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

function setAuthCookie(res, token) {
  res.cookie('ce_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  });
}

async function dbQuery(sql, params = []) {
  if (!pool) throw new Error('Banco Render Postgres não configurado.');
  return pool.query(sql, params);
}

async function migrate() {
  if (!hasDatabase) return;
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await pool.query(schema);
  await seedDemoData();
}

async function seedDemoData() {
  if (pool) {
    const orgResult = await pool.query(`
      insert into organizations(name, slug, plan, status, credits_balance, credits_expires_at)
      values('Escritório Demonstração', 'demo', 'trial', 'active', 89.90, now() + interval '30 days')
      on conflict(slug) do update set updated_at = now()
      returning *
    `);
    const org = orgResult.rows[0];
    const demoEmail = 'demo@contai.test';
    const exists = await pool.query('select id from users where email=$1', [demoEmail]);
    if (!exists.rowCount) {
      const hash = await bcrypt.hash('demo123', 10);
      await pool.query(
        'insert into users(organization_id,name,email,password_hash,role,status) values($1,$2,$3,$4,$5,$6)',
        [org.id, 'Usuário Demonstração', demoEmail, hash, 'admin', 'active']
      );
    }
    await pool.query(`
      insert into obligations(organization_id,name,area,frequency,due_day)
      select $1, x.name, x.area, 'Mensal', x.due_day
      from (values
        ('Buscar notas fiscais','Fiscal',5),
        ('Conciliação bancária','Contábil',10),
        ('DCTFWeb','Trabalhista',15),
        ('Relatório mensal ao cliente','Contábil',20)
      ) as x(name,area,due_day)
      where not exists (select 1 from obligations where organization_id=$1)
    `, [org.id]);
    await pool.query(`
      insert into companies(organization_id,legal_name,trade_name,cnpj,internal_code,tax_regime,activity,status)
      select $1,'Empresa Teste Online LTDA','Empresa Teste','00000000000100','001','Simples Nacional','Serviços contábeis','active'
      where not exists (select 1 from companies where organization_id=$1)
    `, [org.id]);
    return;
  }
  if (!memory.users.length) {
    const hash = await bcrypt.hash('demo123', 10);
    memory.users.push({ id: 'demo-user', organization_id: memory.org.id, name: 'Usuário Demonstração', email: 'demo@contai.test', password_hash: hash, role: 'admin', status: 'active' });
    memory.companies.push({ id: 'demo-company', organization_id: memory.org.id, legal_name: 'Empresa Teste Online LTDA', trade_name: 'Empresa Teste', cnpj: '00000000000100', internal_code: '001', tax_regime: 'Simples Nacional', activity: 'Serviços contábeis', status: 'active', blocked: false });
    memory.obligations.push(
      { id: 'obl-1', organization_id: memory.org.id, name: 'Buscar notas fiscais', area: 'Fiscal', frequency: 'Mensal', due_day: 5, active: true },
      { id: 'obl-2', organization_id: memory.org.id, name: 'Conciliação bancária', area: 'Contábil', frequency: 'Mensal', due_day: 10, active: true },
      { id: 'obl-3', organization_id: memory.org.id, name: 'DCTFWeb', area: 'Trabalhista', frequency: 'Mensal', due_day: 15, active: true },
      { id: 'obl-4', organization_id: memory.org.id, name: 'Relatório mensal ao cliente', area: 'Contábil', frequency: 'Mensal', due_day: 20, active: true }
    );
  }
}

function requireAuth(req, res, next) {
  const token = req.cookies.ce_token;
  if (!token) return res.status(401).json({ error: 'Acesso não autenticado.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessão expirada.' });
  }
}

async function getCurrentUser(userId) {
  if (pool) {
    const result = await dbQuery('select id, organization_id, name, email, role, status from users where id=$1 and status=$2', [userId, 'active']);
    return result.rows[0] || null;
  }
  return memory.users.find((u) => u.id === userId && u.status === 'active') || null;
}

async function getOrg(orgId) {
  if (pool) {
    const result = await dbQuery('select * from organizations where id=$1', [orgId]);
    return result.rows[0] || null;
  }
  return memory.org.id === orgId ? memory.org : null;
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, mode: hasDatabase ? 'render-postgres' : 'demo-memory', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  let user;
  if (pool) {
    const result = await dbQuery('select * from users where email=$1 and status=$2', [email, 'active']);
    user = result.rows[0];
  } else {
    user = memory.users.find((u) => u.email === email && u.status === 'active');
  }
  if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('ce_token');
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  const user = await getCurrentUser(req.user.sub);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
  const org = await getOrg(user.organization_id);
  res.json({ user, organization: org, databaseMode: hasDatabase ? 'render-postgres' : 'demo-memory' });
});

app.get('/api/bootstrap', requireAuth, async (req, res) => {
  const orgId = req.user.organization_id;
  if (pool) {
    const [org, companies, obligations, tasks, contacts] = await Promise.all([
      dbQuery('select * from organizations where id=$1', [orgId]),
      dbQuery('select * from companies where organization_id=$1 order by created_at desc', [orgId]),
      dbQuery('select * from obligations where organization_id=$1 order by area,name', [orgId]),
      dbQuery('select * from tasks where organization_id=$1 order by created_at desc limit 200', [orgId]),
      dbQuery('select * from contacts where organization_id=$1 order by created_at desc limit 200', [orgId])
    ]);
    return res.json({ organization: org.rows[0], companies: companies.rows, obligations: obligations.rows, tasks: tasks.rows, contacts: contacts.rows });
  }
  res.json({ organization: memory.org, companies: memory.companies, obligations: memory.obligations, tasks: memory.tasks, contacts: memory.contacts });
});

app.post('/api/companies', requireAuth, async (req, res) => {
  const orgId = req.user.organization_id;
  const payload = {
    legal_name: String(req.body.legal_name || '').trim(),
    trade_name: String(req.body.trade_name || '').trim(),
    cnpj: String(req.body.cnpj || '').replace(/\D/g, ''),
    internal_code: String(req.body.internal_code || '').trim(),
    tax_regime: String(req.body.tax_regime || 'Simples Nacional').trim(),
    activity: String(req.body.activity || '').trim(),
    status: String(req.body.status || 'active').trim()
  };
  if (!payload.legal_name) return res.status(400).json({ error: 'Informe a razão social.' });
  if (pool) {
    const result = await dbQuery(`insert into companies(organization_id,legal_name,trade_name,cnpj,internal_code,tax_regime,activity,status)
      values($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [orgId, payload.legal_name, payload.trade_name, payload.cnpj, payload.internal_code, payload.tax_regime, payload.activity, payload.status]);
    return res.status(201).json(result.rows[0]);
  }
  const company = { id: `company-${Date.now()}`, organization_id: orgId, ...payload, blocked: false };
  memory.companies.unshift(company);
  res.status(201).json(company);
});

app.post('/api/obligations', requireAuth, async (req, res) => {
  const orgId = req.user.organization_id;
  const payload = {
    name: String(req.body.name || '').trim(),
    area: String(req.body.area || 'Fiscal').trim(),
    frequency: String(req.body.frequency || 'Mensal').trim(),
    due_day: Number(req.body.due_day || 0) || null
  };
  if (!payload.name) return res.status(400).json({ error: 'Informe o nome da obrigação.' });
  if (pool) {
    const result = await dbQuery(`insert into obligations(organization_id,name,area,frequency,due_day) values($1,$2,$3,$4,$5) returning *`, [orgId, payload.name, payload.area, payload.frequency, payload.due_day]);
    return res.status(201).json(result.rows[0]);
  }
  const obligation = { id: `obl-${Date.now()}`, organization_id: orgId, active: true, ...payload };
  memory.obligations.unshift(obligation);
  res.status(201).json(obligation);
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  const orgId = req.user.organization_id;
  const payload = {
    company_id: req.body.company_id,
    obligation_id: req.body.obligation_id || null,
    competence: String(req.body.competence || '').trim(),
    title: String(req.body.title || '').trim(),
    responsible: String(req.body.responsible || '').trim(),
    due_date: req.body.due_date || null,
    notes: String(req.body.notes || '').trim()
  };
  if (!payload.company_id || !payload.title || !payload.competence) return res.status(400).json({ error: 'Empresa, competência e título são obrigatórios.' });
  if (pool) {
    const result = await dbQuery(`insert into tasks(organization_id,company_id,obligation_id,competence,title,responsible,due_date,notes)
      values($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [orgId, payload.company_id, payload.obligation_id, payload.competence, payload.title, payload.responsible, payload.due_date, payload.notes]);
    return res.status(201).json(result.rows[0]);
  }
  const task = { id: `task-${Date.now()}`, organization_id: orgId, status: 'pending', ...payload };
  memory.tasks.unshift(task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id/toggle', requireAuth, async (req, res) => {
  const orgId = req.user.organization_id;
  if (pool) {
    const existing = await dbQuery('select * from tasks where id=$1 and organization_id=$2', [req.params.id, orgId]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    const next = existing.rows[0].status === 'done' ? 'pending' : 'done';
    const result = await dbQuery(`update tasks set status=$1, completed_at=case when $1='done' then now() else null end, updated_at=now() where id=$2 returning *`, [next, req.params.id]);
    return res.json(result.rows[0]);
  }
  const task = memory.tasks.find((t) => t.id === req.params.id && t.organization_id === orgId);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });
  task.status = task.status === 'done' ? 'pending' : 'done';
  task.completed_at = task.status === 'done' ? new Date().toISOString() : null;
  res.json(task);
});

app.post('/api/billing/checkout', requireAuth, async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (!amount || amount < 1) return res.status(400).json({ error: 'Informe um valor válido.' });
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return res.status(501).json({ error: 'Mercado Pago ainda não configurado. Configure MERCADO_PAGO_ACCESS_TOKEN no Render.', mode: 'pending_config' });
  }
  return res.status(202).json({ error: 'Checkout Mercado Pago pendente de ativação final.', mode: 'stub', amount, credits_days: 30 });
});

app.get('/app', (_req, res) => res.sendFile(path.join(__dirname, 'public/app.html')));
app.get('/demo', (_req, res) => res.redirect('/?demo=1'));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

await seedDemoData();
migrate().then(() => {
  app.listen(PORT, () => console.log(`Controle Empresas rodando na porta ${PORT} - modo ${hasDatabase ? 'Render Postgres' : 'demo-memory'}`));
}).catch((error) => {
  console.error('Falha ao iniciar banco:', error);
  process.exit(1);
});
