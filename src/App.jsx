import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  ArrowUpRight,
  Bell,
  LockKeyhole,
  Percent,
} from 'lucide-react';
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

const featureCards = [
  { title: 'Controle de empresas', text: 'Cadastro, regime, responsáveis, contatos, status e bloqueio por pagamento.', icon: Building2 },
  { title: 'Fechamento mensal', text: 'Checklist por competência, tarefas por responsável e visão do que falta fazer.', icon: CheckCircle2 },
  { title: 'Calendário e alertas', text: 'Avisos de obrigações próximas, vencidas e pendentes por empresa.', icon: Bell },
  { title: 'Documentos', text: 'Central para guias, comprovantes, solicitações e arquivos por cliente.', icon: FolderOpen },
  { title: 'Área do cliente', text: 'Portal simples para o cliente visualizar documentos e pendências.', icon: ShieldCheck },
  { title: 'Fator R e base técnica', text: 'Módulos de apoio tributário para estudos e decisões internas.', icon: Percent },
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
  const [loginOpen, setLoginOpen] = useState(false);
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

  const stats = useMemo(() => ({
    total: empresas.length,
    ativas: empresas.filter((e) => e.status === 'ativa').length,
    implantacao: empresas.filter((e) => e.status === 'implantacao').length,
    suspensas: empresas.filter((e) => e.status === 'suspensa').length,
  }), [empresas]);

  if (loading && !session) return <div className="splash">Carregando Controle de Empresa...</div>;

  if (!session) {
    return (
      <main className="landing-page">
        <header className="landing-topbar">
          <div className="landing-brand">
            <div className="landing-logo">CE</div>
            <div><strong>Cont.AI</strong><span>Controle de empresas para escritórios contábeis</span></div>
          </div>
          <nav className="landing-nav">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#cliente">Área do cliente</a>
            <a href="#planos">Planos</a>
            <button className="login-bubble" type="button" onClick={() => setLoginOpen(true)}><span><ArrowUpRight size={15} /></span> Faça seu login aqui</button>
          </nav>
        </header>

        <section className="landing-hero">
          <div>
            <span className="kicker">Sistema de gestão contábil</span>
            <h1>Organize empresas, obrigações, documentos e prazos em um único painel.</h1>
            <p>O Cont.AI foi pensado para a rotina de escritórios contábeis: competências, alertas de vencimento, tarefas por responsável, documentos dos clientes e relatórios de acompanhamento.</p>
            <div className="landing-actions">
              <button className="primary-cta" type="button" onClick={() => setLoginOpen(true)}>Faça seu login aqui</button>
              <a className="ghost-cta" href="#cliente">Ver área do cliente</a>
            </div>
            <div className="landing-metrics">
              <MetricMini value="01" label="painel central" />
              <MetricMini value="05" label="áreas integradas" />
              <MetricMini value="100%" label="foco contábil" />
            </div>
          </div>

          <div className="landing-preview-rich">
            <div className="preview-window">
              <div className="window-dots"><i></i><i></i><i></i><strong>Painel contábil inteligente</strong></div>
              <div className="fake-dashboard">
                <div className="overlay-card top"><small>Produtividade</small><strong>74%</strong><span>competência em andamento</span></div>
                <div className="overlay-card bottom"><small>Clientes ativos</small><strong>128</strong><span>acessos organizados</span></div>
              </div>
            </div>
            <div className="preview-grid rich">
              <div><small>Pendências</small><strong>27</strong><span>exigem acompanhamento</span></div>
              <div><small>Empresas</small><strong>128</strong><span>em carteira</span></div>
              <div><small>Vencendo</small><strong>12</strong><span>próximos 5 dias</span></div>
              <div><small>Concluídas</small><strong>74%</strong><span>competência atual</span></div>
            </div>
          </div>
        </section>

        <section className="visual-strip">
          <SectionTitle tag="Visão do sistema" title="Mais visual, mais claro e ainda objetivo" text="Uma apresentação com mais vida para o cliente entender rapidamente como o Cont.AI funciona, sem poluição visual." />
          <div className="visual-grid">
            <VisualCard title="Painel com visão geral" tag="Dashboard" text="Cards de acompanhamento, semáforo de pendências e foco no que precisa ser feito primeiro." large />
            <VisualCard title="Portal enxuto" tag="Cliente" text="O cliente visualiza apenas documentos, solicitações, guias e avisos." />
            <VisualCard title="Documentos e tarefas" tag="Operação" text="Fluxo para anexos, tarefas internas e módulos de apoio do escritório." />
          </div>
        </section>

        <section className="landing-section" id="funcionalidades">
          <SectionTitle tag="Funcionalidades" title="O que o sistema faz" text="Uma visão prática para testar antes de transformar o projeto em ambiente online completo." />
          <div className="feature-grid">
            {featureCards.map((card) => <FeatureCard key={card.title} {...card} />)}
          </div>
        </section>

        <section className="client-section" id="cliente">
          <div>
            <span className="kicker">Área do cliente</span>
            <h2>Um portal mais simples para o cliente acompanhar o que precisa enviar.</h2>
            <p>A ideia é separar o que é interno do escritório daquilo que o cliente deve enxergar: pendências, documentos solicitados, guias, avisos e status de acesso.</p>
            <div className="client-bullets">
              <div><strong>01</strong><span>Cliente acessa somente a própria empresa.</span></div>
              <div><strong>02</strong><span>Visualiza documentos e obrigações solicitadas.</span></div>
              <div><strong>03</strong><span>Acesso pode ser bloqueado em caso de falta de pagamento.</span></div>
            </div>
          </div>
          <div className="client-preview">
            <div className="client-preview-head"><strong>Portal do Cliente</strong><span>Acesso ativo</span></div>
            <div><small>Documentos pendentes</small><strong>4 solicitações</strong><p>Notas de serviço, extratos bancários, folha e comprovantes.</p></div>
            <div><small>Guias disponíveis</small><strong>2 arquivos</strong><p>DAS e DCTFWeb liberadas para conferência.</p></div>
            <div className="muted"><small>Contato do escritório</small><strong>Fiscal responsável</strong><p>Canal rápido para tratar pendências da competência.</p></div>
          </div>
        </section>

        <section className="process-section">
          <SectionTitle tag="Como funciona" title="Uma jornada clara para o escritório e para o cliente" text="Organização interna, portal do cliente e acompanhamento das competências em uma mesma plataforma." />
          <div className="process-grid">
            <ProcessStep n="01" title="Organize a carteira" text="Cadastre empresas, grupos de obrigações, responsáveis, regime por vigência e contatos." />
            <ProcessStep n="02" title="Acompanhe o fechamento" text="Use checklist, calendário, alertas e documentos para centralizar o que foi feito e o que falta fazer." />
            <ProcessStep n="03" title="Entregue ao cliente" text="Libere portal, comunicações, guias e solicitações com acesso controlado." />
          </div>
        </section>

        <section className="pricing-section" id="planos">
          <SectionTitle tag="Planos" title="Preparado para assinatura mensal" text="Estrutura pensada para liberar acesso por cliente após pagamento quando o sistema estiver completo." />
          <div className="pricing-card"><div><h3>Plano mensal</h3><p>Cadastro de empresas ilimitado, 1 usuário incluso e cobrança adicional por usuário extra.</p></div><div className="price-box"><small>a partir de</small><strong>R$ 89,90</strong><span>+ R$ 39,90 por usuário adicional</span></div></div>
        </section>

        <section className="access-cta">
          <div><span>Acesso ao sistema</span><h2>Pronto para entrar no Cont.AI?</h2><p>O acesso fica no topo da página para manter a apresentação limpa.</p></div>
          <button className="primary-cta" onClick={() => setLoginOpen(true)}>Abrir login</button>
        </section>

        {loginOpen && (
          <div className="login-modal" onMouseDown={(e) => { if (e.target.className === 'login-modal') setLoginOpen(false); }}>
            <div className="login-popup-card">
              <button className="login-close" onClick={() => setLoginOpen(false)}>×</button>
              <section className="login-side">
                <span>Acesso seguro</span>
                <h2>Entre no sistema</h2>
                <p>Use o e-mail cadastrado no Supabase para acessar o ambiente online.</p>
                <div className="login-points"><div><b></b>Controle de empresas, obrigações e documentos</div><div><b></b>Área do cliente com permissões separadas</div><div><b></b>Fluxo preparado para Render + Supabase</div></div>
              </section>
              <form onSubmit={signIn} className="login-form-card">
                <div className="form-brand"><div className="landing-logo">CE</div><div><strong>Faça seu login aqui</strong><span>Informe seu e-mail e senha</span></div></div>
                <label>E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com.br" />
                <label>Senha</label>
                <div className="password-shell"><LockKeyhole size={16} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" /></div>
                {error && <div className="error-box">{error}</div>}
                <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar no controle'}</button>
                <small>Acesso restrito aos usuários cadastrados na plataforma.</small>
              </form>
            </div>
          </div>
        )}
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
        <nav>{menuItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon size={18} />{item.label}</button>; })}</nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <button className="menu-button"><Menu size={20} /></button>
          <div><strong>{profile?.nome || profile?.email || session.user.email}</strong><span>{profile?.papel || org?.membroPapel || 'usuário'} · {assinatura?.status || 'sem assinatura'}</span></div>
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

function MetricMini({ value, label }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
function SectionTitle({ tag, title, text }) { return <div className="section-title"><span>{tag}</span><h2>{title}</h2><p>{text}</p></div>; }
function FeatureCard({ title, text, icon: Icon }) { return <article className="feature-card"><div className="feature-thumb"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p></article>; }
function VisualCard({ title, tag, text, large }) { return <article className={large ? 'visual-card large' : 'visual-card'}><span>{tag}</span><h3>{title}</h3><div className="visual-screen"><i></i><i></i><i></i></div><p>{text}</p></article>; }
function ProcessStep({ n, title, text }) { return <article className="process-step"><span>{n}</span><div></div><h3>{title}</h3><p>{text}</p></article>; }
function Dashboard({ stats, org, assinatura }) { return <div className="page"><h1>Dashboard</h1><p>Ambiente online conectado ao Supabase.</p><div className="cards"><Metric label="Total de empresas" value={stats.total} /><Metric label="Ativas" value={stats.ativas} /><Metric label="Em implantação" value={stats.implantacao} /><Metric label="Suspensas" value={stats.suspensas} /></div><section className="panel"><h2>Assinatura</h2><p><strong>Organização:</strong> {org?.nome}</p><p><strong>Status:</strong> {assinatura?.status || 'não localizada'}</p><p><strong>Limite usuários:</strong> {assinatura?.limite_usuarios || '-'}</p></section></div>; }
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Empresas({ empresas, reload, form, setForm, save, saving }) { return <div className="page"><div className="page-header"><div><h1>Empresas</h1><p>Cadastro gravado no Supabase.</p></div><button className="ghost" onClick={reload}><RefreshCw size={16} /> Recarregar</button></div><form className="company-form" onSubmit={save}><input placeholder="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /><input placeholder="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /><input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /><input placeholder="Código interno" value={form.codigo_interno} onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} /><select value={form.regime_atual} onChange={(e) => setForm({ ...form, regime_atual: e.target.value })}><option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option><option>Imune/Isenta</option></select><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ativa">Ativa</option><option value="implantacao">Implantação</option><option value="suspensa">Suspensa</option><option value="baixada">Baixada</option></select><textarea placeholder="Atividade" value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })} /><button disabled={saving}><Plus size={16} /> {saving ? 'Salvando...' : 'Cadastrar empresa'}</button></form><div className="table-card"><table><thead><tr><th>Razão social</th><th>Fantasia</th><th>CNPJ</th><th>Regime</th><th>Status</th></tr></thead><tbody>{empresas.map((empresa) => <tr key={empresa.id}><td>{empresa.razao_social}</td><td>{empresa.nome_fantasia}</td><td>{empresa.cnpj}</td><td>{empresa.regime_atual}</td><td>{empresa.status}</td></tr>)}{!empresas.length && <tr><td colSpan="5">Nenhuma empresa encontrada.</td></tr>}</tbody></table></div></div>; }
function Placeholder({ title }) { return <div className="page"><h1>{title}</h1><p>Módulo reservado para a próxima etapa da migração.</p></div>; }
