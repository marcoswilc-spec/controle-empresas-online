import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Mail,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { supabase } from './lib/supabase';

const FALLBACK_ORG_ID = '0f0f736a-1af7-4049-b5e6-ef3313cd2b8f';

const menuGroups = [
  {
    title: 'Geral',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Cadastro',
    items: [
      { id: 'empresas', label: 'Empresas', icon: Building2 },
      { id: 'usuarios', label: 'Usuários', icon: Users },
      { id: 'contatos', label: 'Agenda/Contatos', icon: Mail },
      { id: 'cliente', label: 'Área do Cliente', icon: ShieldCheck },
    ],
  },
  {
    title: 'Operacional',
    items: [
      { id: 'fiscal', label: 'Conferência Fiscal', icon: Sparkles },
      { id: 'pendencias', label: 'Pendências', icon: FileText },
      { id: 'fechamento', label: 'Fechamento Mensal', icon: CheckCircle2 },
      { id: 'relatorios', label: 'Relatórios', icon: FileText },
      { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    ],
  },
  {
    title: 'Módulos Inteligentes',
    items: [
      { id: 'links', label: 'Links Rápidos', icon: LinkIcon },
      { id: 'fatorr', label: 'Fator R', icon: Sparkles },
      { id: 'documentos', label: 'Documentos', icon: FolderOpen },
      { id: 'chamados', label: 'Chamado Interno', icon: RefreshCw },
      { id: 'base', label: 'Base Analista', icon: Sparkles },
    ],
  },
];

const flatMenu = menuGroups.flatMap((g) => g.items);

function emptyCompany() {
  return {
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    codigo_interno: '',
    regime_atual: 'Simples Nacional',
    atividade: '',
    status: 'ativa',
  };
}

function normalizarCnpj(cnpj) {
  const v = String(cnpj || '').replace(/\D/g, '');
  if (v.length !== 14) return cnpj || '';
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [empresaForm, setEmpresaForm] = useState(emptyCompany());
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [buscaEmpresa, setBuscaEmpresa] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setOrg(null);
      setAssinatura(null);
      setEmpresas([]);
      return;
    }
    loadUserContext(session.user);
  }, [session]);

  useEffect(() => {
    if (org?.id) loadEmpresas(org.id);
  }, [org?.id]);

  async function loadUserContext(user) {
    setLoading(true);
    setError('');
    try {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('id,nome,email,papel')
        .eq('id', user.id)
        .maybeSingle();
      if (profError) throw profError;
      setProfile(prof || { email: user.email, nome: user.email, papel: 'usuário' });

      let orgId = null;
      let membroPapel = null;

      const { data: membro } = await supabase
        .from('organizacao_membros')
        .select('organizacao_id,papel,ativo')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();
      if (membro?.organizacao_id) {
        orgId = membro.organizacao_id;
        membroPapel = membro.papel;
      }

      if (!orgId) {
        const { data: ownerOrg } = await supabase
          .from('organizacoes')
          .select('id,nome,email_cobranca,status,owner_id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();
        if (ownerOrg?.id) orgId = ownerOrg.id;
      }

      if (!orgId) {
        const { data: emailOrg } = await supabase
          .from('organizacoes')
          .select('id,nome,email_cobranca,status,owner_id')
          .ilike('email_cobranca', user.email || '')
          .limit(1)
          .maybeSingle();
        if (emailOrg?.id) orgId = emailOrg.id;
      }

      if (!orgId && String(user.email || '').toLowerCase() === 'marcoswilc@gmail.com') {
        orgId = FALLBACK_ORG_ID;
        membroPapel = 'owner';
      }

      if (!orgId) throw new Error('Usuário sem organização vinculada.');

      const { data: orgData, error: orgError } = await supabase
        .from('organizacoes')
        .select('id,nome,email_cobranca,status,owner_id')
        .eq('id', orgId)
        .maybeSingle();
      if (orgError) throw orgError;
      setOrg({ ...(orgData || { id: orgId, nome: 'Controle Empresas - Ambiente Teste' }), membroPapel });

      const { data: assinaturaData } = await supabase
        .from('assinaturas')
        .select('status,plano,valor_base,limite_usuarios,valor_usuario_extra,vencimento,motivo_bloqueio')
        .eq('organizacao_id', orgId)
        .maybeSingle();
      setAssinatura(assinaturaData || { status: 'ativa', plano: 'manual', limite_usuarios: 1 });
    } catch (err) {
      setError(err.message || 'Falha ao carregar usuário.');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmpresas(orgId) {
    const { data, error: empError } = await supabase
      .from('empresas')
      .select('*')
      .eq('organizacao_id', orgId)
      .order('razao_social', { ascending: true });
    if (empError) {
      setError(empError.message);
      return;
    }
    setEmpresas(data || []);
  }

  async function signIn(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError(authError.message);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function saveEmpresa(event) {
    event.preventDefault();
    if (!org?.id) return;
    setSavingEmpresa(true);
    setError('');
    try {
      const payload = {
        organizacao_id: org.id,
        ...empresaForm,
        cnpj: (empresaForm.cnpj || '').replace(/\D/g, ''),
        updated_at: new Date().toISOString(),
      };
      const { error: insertError } = await supabase.from('empresas').insert(payload);
      if (insertError) throw insertError;
      setEmpresaForm(emptyCompany());
      await loadEmpresas(org.id);
    } catch (err) {
      setError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setSavingEmpresa(false);
    }
  }

  const assinaturaAtiva = useMemo(() => {
    if (!assinatura) return true;
    return ['ativa', 'teste', 'manual'].includes(String(assinatura.status || '').toLowerCase());
  }, [assinatura]);

  const empresasFiltradas = useMemo(() => {
    const q = buscaEmpresa.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) => [e.razao_social, e.nome_fantasia, e.cnpj, e.codigo_interno].join(' ').toLowerCase().includes(q));
  }, [empresas, buscaEmpresa]);

  const stats = useMemo(() => ({
    total: empresas.length,
    ativas: empresas.filter((e) => e.status === 'ativa').length,
    implantacao: empresas.filter((e) => e.status === 'implantacao').length,
    suspensas: empresas.filter((e) => e.status === 'suspensa').length,
    baixadas: empresas.filter((e) => e.status === 'baixada').length,
  }), [empresas]);

  if (loading && !session) return <div className="splash">Carregando Controle de Empresa...</div>;

  if (!session) {
    return <Landing loginOpen={loginOpen} setLoginOpen={setLoginOpen} email={email} setEmail={setEmail} password={password} setPassword={setPassword} error={error} signIn={signIn} loading={loading} />;
  }

  if (assinatura && !assinaturaAtiva) {
    return (
      <main className="blocked-page">
        <section className="blocked-card">
          <h1>Acesso temporariamente interrompido</h1>
          <p>A assinatura da organização não está ativa.</p>
          <strong>Status: {assinatura.status}</strong>
          <p>{assinatura.motivo_bloqueio || 'Regularize o pagamento para continuar usando.'}</p>
          <button onClick={signOut}>Sair</button>
        </section>
      </main>
    );
  }

  return (
    <div className="legacy-shell">
      <aside className="legacy-sidebar">
        <div className="legacy-brand"><div className="legacy-logo">CE</div><div><strong>Controle de Empresa</strong><span>Módulo integrado</span></div></div>
        <nav>
          {menuGroups.map((group) => (
            <div className="menu-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon size={17} />{item.label}</button>;
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="legacy-main">
        <header className="legacy-topbar">
          <button className="icon-btn"><Menu size={22} /></button>
          <div className="filters-grid">
            <label>Competência<select><option>10/2026</option><option>09/2026</option></select></label>
            <label>Empresa<select><option>Todas empresas</option>{empresas.map((e) => <option key={e.id}>{e.nome_fantasia || e.razao_social}</option>)}</select></label>
            <label>Nome/Cód.<input placeholder="nome ou código" /></label>
            <label>Regime<select><option>Todos</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option></select></label>
            <label>Responsável<select><option>Todos</option></select></label>
          </div>
          <div className="quick-actions">
            <button>Limpar</button><button>Próximo mês</button><button>Grupos/Obrigações</button><button>Usuários</button><button>Relatório</button><button>Contatos</button><button>Área do cliente</button><button>Calendário</button><button>Links</button><button>Backup</button><button>CSV</button><button>Imprimir</button><button className="primary">+ Verificar</button><button>Alertas</button><button onClick={signOut}>Sair</button>
          </div>
        </header>

        <section className="identity-row">
          <div><strong>{profile?.nome || profile?.email || session.user.email}</strong><span>{profile?.papel || org?.membroPapel || 'usuário'} · {assinatura?.status || 'sem assinatura'} · {org?.nome || 'Organização'}</span></div>
        </section>

        {error && <div className="error-box">{error}</div>}

        {view === 'dashboard' && <Dashboard stats={stats} org={org} assinatura={assinatura} />}
        {view === 'empresas' && <Empresas empresas={empresasFiltradas} busca={buscaEmpresa} setBusca={setBuscaEmpresa} reload={() => loadEmpresas(org.id)} form={empresaForm} setForm={setEmpresaForm} save={saveEmpresa} saving={savingEmpresa} />}
        {view !== 'dashboard' && view !== 'empresas' && <Placeholder title={flatMenu.find((m) => m.id === view)?.label} />}
      </main>
    </div>
  );
}

function Landing({ loginOpen, setLoginOpen, email, setEmail, password, setPassword, error, signIn, loading }) {
  return (
    <main className="site-home">
      <header className="site-nav"><div className="site-brand"><div className="legacy-logo">CE</div><strong>Cont.AI</strong></div><button onClick={() => setLoginOpen(true)}>Faça seu login aqui</button></header>
      <section className="site-hero">
        <div className="hero-copy"><span>Controle empresarial online</span><h1>Gestão contábil, documentos e obrigações em um só lugar.</h1><p>Organize empresas, equipe, pendências, área do cliente e alertas em uma plataforma visual preparada para Render + Supabase.</p><div className="hero-buttons"><button onClick={() => setLoginOpen(true)}>Entrar no sistema</button><button>Ver funcionalidades</button></div></div>
        <div className="hero-board"><div className="fake-window"><b>Dashboard inteligente</b><div></div><div></div><div></div></div><div className="floating-card">Área do cliente</div><div className="floating-card second">Documentos e guias</div></div>
      </section>
      <section className="features"><article><Building2 />Empresas e regimes</article><article><FolderOpen />Documentos com controle</article><article><Users />Equipe e usuários</article><article><CalendarDays />Calendário de vencimentos</article></section>
      {loginOpen && <div className="login-overlay"><div className="login-panel"><div className="login-info"><span>Acesso seguro</span><h2>Entre no sistema</h2><p>Use o e-mail cadastrado no Supabase para acessar o ambiente online.</p><ul><li>Controle de empresas, obrigações e documentos</li><li>Área do cliente com permissões separadas</li><li>Fluxo preparado para Render + Supabase</li></ul></div><form onSubmit={signIn} className="login-box"><button type="button" className="close" onClick={() => setLoginOpen(false)}><X size={18} /></button><div className="brand-line"><div className="legacy-logo">CE</div><div><h3>Faça seu login aqui</h3><p>Informe seu e-mail e senha</p></div></div><label>E-mail</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marcoswilc@gmail.com" autoFocus /><label>Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" />{error && <div className="error-box">{error}</div>}<button disabled={loading}>{loading ? 'Entrando...' : 'Entrar no controle'}</button><small>Acesso restrito aos usuários cadastrados na plataforma.</small></form></div></div>}
    </main>
  );
}

function Dashboard({ stats, org, assinatura }) {
  return (
    <div className="legacy-page"><h1>Dashboard</h1><p>Ambiente online conectado ao Supabase.</p><div className="kpi-grid"><Metric label="Total de empresas" value={stats.total} /><Metric label="Ativas" value={stats.ativas} /><Metric label="Em implantação" value={stats.implantacao} /><Metric label="Suspensas" value={stats.suspensas} /><Metric label="Baixadas" value={stats.baixadas} /></div><section className="panel"><h2>Assinatura</h2><p><strong>Organização:</strong> {org?.nome}</p><p><strong>Status:</strong> {assinatura?.status || 'não localizada'}</p><p><strong>Limite usuários:</strong> {assinatura?.limite_usuarios || '-'}</p></section></div>
  );
}

function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>no cadastro</small></div>; }

function Empresas({ empresas, busca, setBusca, reload, form, setForm, save, saving }) {
  return (
    <div className="legacy-page"><div className="page-head"><div><h1>Cadastro de Empresas</h1><p>Gestão cadastral das empresas do escritório</p></div><div className="empresa-tools"><div className="searchbox"><Search size={16} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CNPJ, responsável..." /></div><button onClick={reload}><RefreshCw size={16} /> Recarregar online</button></div></div><form className="company-form legacy-form" onSubmit={save}><input placeholder="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /><input placeholder="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /><input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /><input placeholder="Código interno" value={form.codigo_interno} onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} /><select value={form.regime_atual} onChange={(e) => setForm({ ...form, regime_atual: e.target.value })}><option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option><option>Imune/Isenta</option></select><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ativa">Ativa</option><option value="implantacao">Implantação</option><option value="suspensa">Suspensa</option><option value="baixada">Baixada</option></select><textarea placeholder="Atividade" value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })} /><button disabled={saving}><Plus size={16} /> {saving ? 'Salvando...' : '+ Nova empresa online'}</button></form><div className="table-card"><table><thead><tr><th>Razão social</th><th>Fantasia</th><th>CNPJ</th><th>Regime</th><th>Status</th></tr></thead><tbody>{empresas.map((empresa) => <tr key={empresa.id}><td>{empresa.razao_social}</td><td>{empresa.nome_fantasia}</td><td>{normalizarCnpj(empresa.cnpj)}</td><td>{empresa.regime_atual}</td><td><span className="status-pill">{empresa.status}</span></td></tr>)}{!empresas.length && <tr><td colSpan="5">Nenhuma empresa encontrada.</td></tr>}</tbody></table></div></div>
  );
}

function Placeholder({ title }) { return <div className="legacy-page"><h1>{title}</h1><p>Módulo reservado para a próxima etapa da migração. Vamos ligar este bloco ao Supabase depois que o visual base ficar certo.</p><div className="panel empty-module"><Sparkles /><strong>Próxima etapa</strong><span>Manter visual do HTML anterior e migrar dados módulo por módulo.</span></div></div>; }
