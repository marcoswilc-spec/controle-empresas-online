import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, FileText, FolderOpen, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'empresas', label: 'Empresas', icon: Building2 },
  { id: 'usuarios', label: 'Usuários / Time', icon: Users },
  { id: 'cliente', label: 'Área do Cliente', icon: ShieldCheck },
  { id: 'documentos', label: 'Documentos', icon: FolderOpen },
  { id: 'obrigacoes', label: 'Obrigações', icon: CheckCircle2 },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
];

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

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [empresaForm, setEmpresaForm] = useState(emptyCompany());
  const [savingEmpresa, setSavingEmpresa] = useState(false);

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
      setProfile(prof);

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
          .eq('email_cobranca', user.email)
          .limit(1)
          .maybeSingle();
        if (emailOrg?.id) orgId = emailOrg.id;
      }

      if (!orgId) throw new Error('Usuário sem organização vinculada.');

      const { data: orgData, error: orgError } = await supabase
        .from('organizacoes')
        .select('id,nome,email_cobranca,status,owner_id')
        .eq('id', orgId)
        .single();
      if (orgError) throw orgError;
      setOrg({ ...orgData, membroPapel });

      const { data: assinaturaData } = await supabase
        .from('assinaturas')
        .select('status,plano,valor_base,limite_usuarios,valor_usuario_extra,vencimento,motivo_bloqueio')
        .eq('organizacao_id', orgId)
        .maybeSingle();
      setAssinatura(assinaturaData);
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
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
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
    if (!assinatura) return false;
    return ['ativa', 'teste'].includes(String(assinatura.status || '').toLowerCase());
  }, [assinatura]);

  const stats = useMemo(() => {
    return {
      total: empresas.length,
      ativas: empresas.filter((e) => e.status === 'ativa').length,
      implantacao: empresas.filter((e) => e.status === 'implantacao').length,
      suspensas: empresas.filter((e) => e.status === 'suspensa').length,
    };
  }, [empresas]);

  if (loading && !session) {
    return <div className="splash">Carregando Controle de Empresa...</div>;
  }

  if (!session) {
    return (
      <main className="landing">
        <section className="login-card">
          <div className="brand-line">
            <div className="logo-box">CE</div>
            <div>
              <h1>Controle de Empresa</h1>
              <p>Gestão online para empresas, obrigações, equipe e documentos.</p>
            </div>
          </div>
          <form onSubmit={signIn} className="login-form">
            <label>E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com.br" />
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" />
            {error && <div className="error-box">{error}</div>}
            <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar no controle'}</button>
          </form>
        </section>
        <section className="hero-card">
          <span className="pill">Render + Supabase</span>
          <h2>Sistema remontado para produção</h2>
          <p>Esta base usa Render como hospedagem principal e Supabase para login, banco e documentos.</p>
          <div className="hero-grid">
            <div>Empresas</div>
            <div>Usuários</div>
            <div>Documentos</div>
            <div>Obrigações</div>
          </div>
        </section>
      </main>
    );
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="app-brand"><div className="logo-box">CE</div><div><strong>Controle de Empresa</strong><span>{org?.nome || 'Organização'}</span></div></div>
        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon size={18} />{item.label}</button>;
          })}
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <button className="menu-button"><Menu size={20} /></button>
          <div>
            <strong>{profile?.nome || profile?.email || session.user.email}</strong>
            <span>{profile?.papel || org?.membroPapel || 'usuário'} · {assinatura?.status || 'sem assinatura'}</span>
          </div>
          <button className="ghost" onClick={signOut}><LogOut size={16} /> Sair</button>
        </header>

        {error && <div className="error-box">{error}</div>}

        {view === 'dashboard' && <Dashboard stats={stats} org={org} assinatura={assinatura} />}
        {view === 'empresas' && <Empresas empresas={empresas} reload={() => loadEmpresas(org.id)} form={empresaForm} setForm={setEmpresaForm} save={saveEmpresa} saving={savingEmpresa} />}
        {view !== 'dashboard' && view !== 'empresas' && <Placeholder title={menuItems.find((m) => m.id === view)?.label} />}
      </section>
    </div>
  );
}

function Dashboard({ stats, org, assinatura }) {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Ambiente online conectado ao Supabase.</p>
      <div className="cards">
        <Metric label="Total de empresas" value={stats.total} />
        <Metric label="Ativas" value={stats.ativas} />
        <Metric label="Em implantação" value={stats.implantacao} />
        <Metric label="Suspensas" value={stats.suspensas} />
      </div>
      <section className="panel">
        <h2>Assinatura</h2>
        <p><strong>Organização:</strong> {org?.nome}</p>
        <p><strong>Status:</strong> {assinatura?.status || 'não localizada'}</p>
        <p><strong>Limite usuários:</strong> {assinatura?.limite_usuarios || '-'}</p>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function Empresas({ empresas, reload, form, setForm, save, saving }) {
  return (
    <div className="page">
      <div className="page-header"><div><h1>Empresas</h1><p>Cadastro gravado no Supabase.</p></div><button className="ghost" onClick={reload}><RefreshCw size={16} /> Recarregar</button></div>
      <form className="company-form" onSubmit={save}>
        <input placeholder="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
        <input placeholder="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
        <input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
        <input placeholder="Código interno" value={form.codigo_interno} onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} />
        <select value={form.regime_atual} onChange={(e) => setForm({ ...form, regime_atual: e.target.value })}>
          <option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option><option>Imune/Isenta</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ativa">Ativa</option><option value="implantacao">Implantação</option><option value="suspensa">Suspensa</option><option value="baixada">Baixada</option>
        </select>
        <textarea placeholder="Atividade" value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })} />
        <button disabled={saving}><Plus size={16} /> {saving ? 'Salvando...' : 'Cadastrar empresa'}</button>
      </form>
      <div className="table-card">
        <table>
          <thead><tr><th>Razão social</th><th>Fantasia</th><th>CNPJ</th><th>Regime</th><th>Status</th></tr></thead>
          <tbody>
            {empresas.map((empresa) => <tr key={empresa.id}><td>{empresa.razao_social}</td><td>{empresa.nome_fantasia}</td><td>{empresa.cnpj}</td><td>{empresa.regime_atual}</td><td>{empresa.status}</td></tr>)}
            {!empresas.length && <tr><td colSpan="5">Nenhuma empresa encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return <div className="page"><h1>{title}</h1><p>Módulo reservado para a próxima etapa da migração.</p></div>;
}
