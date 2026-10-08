const {JSDOM, VirtualConsole} = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const errors=[];
const consoleDOM=new VirtualConsole();
consoleDOM.on('jsdomError',e=>{if(e.type==='unhandled-exception')errors.push(e.message)});
const dom=new JSDOM(html,{pretendToBeVisual:true,url:'https://controle.test',runScripts:'dangerously',virtualConsole:consoleDOM,beforeParse(w){w.confirm=()=>true;w.prompt=()=> 'Teste';w.TextEncoder=TextEncoder;w.URL.createObjectURL=()=> 'blob:teste';w.URL.revokeObjectURL=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.scrollTo=()=>{};}});
try{
const run = ()=>{
   const check=(ok,msg)=>{if(!ok) throw Error(msg)};
   const outcomes=[];
   setStorageKeyForUser('TESTE_PROTECAO');
   const fixture=JSON.parse(JSON.stringify(montarBackup()));
   fixture.dados.documentos=[{id:'d1',nomeArquivo:'teste.txt',dataUrl:'data:text/plain;base64,dGVzdGU='}];
   fixture.dados.chamadosInternos=[{id:'t1',titulo:'Teste'}];
   fixture.dados.clientesPortal=[{id:'p1',nome:'Cliente teste'}];
   fixture.dados.fatorR={teste:[{mes:'09/2026',faturamento:'1000',folha:'280'}]};
   fixture.dados.baseAnalista=[{id:'b1',titulo:'Teste'}];
   fixture.dados.checklist={'ausente::09/2026':[{etapaId:'historica',status:'concluido',observacao:'evidência'}]};
   const data=validarDadosBackup(fixture);
   aplicarBackupValidado(data);
   check(JSON.stringify(snapshotEstado())===JSON.stringify(data),'round trip memória');
   check(JSON.stringify(JSON.parse(localStorage.getItem(STORAGE_KEY)))===JSON.stringify(data),'round trip disco');
   outcomes.push('Backup completo: todos os módulos e anexo preservados');
   const old=validarDadosBackup({empresas:[]});
   check(old.documentos.length===0 && Object.keys(old.fatorR).length===0,'legado mistura dados');
   outcomes.push('Backup legado não mistura módulos ausentes com dados anteriores');
   let rejected=0;
   for(const invalid of [{empresas:[],documentos:{}},{empresas:[],checklist:{x:{}}},{versao:'futura',dados:{empresas:[]}}]){
    try{validarDadosBackup(invalid)}catch{rejected++}
   }
   check(rejected===3,'inválidos aceitos');
   outcomes.push('Backups inválidos rejeitados antes de alterar dados');
   const original=Storage.prototype.setItem;
   const before=JSON.stringify(snapshotEstado());
   Storage.prototype.setItem=function(){throw new DOMException('Sem espaço','QuotaExceededError')};
   let failed=false;try{aplicarBackupValidado(old)}catch{failed=true}
   check(failed && JSON.stringify(snapshotEstado())===before,'restauração com falha alterou memória');
   failed=false;try{salvarEstado()}catch{failed=true}
   check(failed,'salvarEstado ocultou falha');
   let exported=false;const download=baixarJSON;baixarJSON=()=>{exported=true};
   baixarBackupManual(); baixarJSON=download;
   check(exported,'backup de emergência bloqueado');
   Storage.prototype.setItem=original;
   outcomes.push('Falha de gravação comunicada; restauração preserva base; exportação funciona sem espaço');
   const emp={id:'teste',nome:'Empresa teste',cnpj:'00000000000000',regime:'Simples Nacional',inicioCompetencia:'01/2020',responsaveis:{fiscal:'TESTE'}};
   state.empresas=[emp];
   const current=competenciaDoMesAtual();
   const future='12/2099';
   state.checklist['teste::'+future]=[{etapaId:'obrig::antiga',status:'concluido',observacao:'protocolo',prazo:'2099-12-20'}];
   const expected=JSON.stringify(state.checklist['teste::'+future]);
   deixarChecklistEmBranco(emp,future);getChecklistEmpresa('teste',future);
   check(JSON.stringify(state.checklist['teste::'+future])===expected,'futuro alterado');
   state.checklist['teste::09/2026']=[{etapaId:'obrig::antiga',status:'concluido',observacao:'histórico'}];
   const hist=JSON.stringify(state.checklist['teste::09/2026']);
   sincronizarChecklistObrigacoes(emp,'09/2026');
   check(JSON.stringify(state.checklist['teste::09/2026'])===hist,'histórico alterado');
   salvarEstado();carregarEstado();
   check(JSON.stringify(state.checklist['teste::'+future])===expected,'carga reiniciou futuro');
   check(state.checklist['ausente::09/2026'],'carga removeu órfão');
   outcomes.push('Reabertura e geração de competências preservam tarefas futuras, histórico e registros órfãos');
   // Invalid storage must never be replaced by an empty state.
   localStorage.setItem(STORAGE_KEY,'{inválido');
   failed=false;try{carregarEstado()}catch{failed=true}
   check(failed,'carga inválida não bloqueou');
   try{salvarEstado()}catch{}
   check(localStorage.getItem(STORAGE_KEY)==='{inválido','base ilegível sobrescrita');
   aplicarBackupValidado(old);
   outcomes.push('Base ilegível preservada e gravação bloqueada');
   liberarAcessoModulo({usuario:'TESTE_PROTECAO',perfil:'Administrador',nome:'Teste'},false);
   for(const view of ['dashboard','empresas','pendencias','fechamento','relatorios','usuarios','contatos','links','clientes','fatorr','documentos','chamados','base','calendario']) navegarPara(view);
   outcomes.push('Navegação dos módulos executada sem exceções');
   state.documentos=[{id:'doc_aprovar',nomeArquivo:'teste.txt'}];
   PORTAL_ROLE='Operacional'; PORTAL_USER='OPERADOR';
   registrarSolicitacaoExclusao('documento','doc_aprovar','teste.txt');
   const req=state.solicitacoesExclusao.find(r=>r.itemId==='doc_aprovar');
   check(req && state.documentos.length===1,'solicitação removeu documento');
   executarSolicitacaoMaster(req.id);
   check(state.documentos.length===1 && req.status==='pendente','operador aprovou exclusão');
   PORTAL_ROLE='Administrador';PORTAL_USER='ADMIN';
   executarSolicitacaoMaster(req.id);
   check(state.documentos.length===0 && req.status==='executada','admin não executou exclusão');
   outcomes.push('Exclusão: operador solicita, somente administrador executa');
   return outcomes;
};
const result=dom.window.eval('('+run.toString()+')()');
assert.deepEqual(errors,[]);
console.log(result.join('\n'));
console.log('Sintaxe e execução de DOM verificadas; sem validação visual em navegador real.');
}finally{dom.window.close()}
