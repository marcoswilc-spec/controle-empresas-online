# Plano de evolução — Controle de Empresa

Data: 08/10/2026. Diretriz: preservar o HTML, seus módulos e os dados existentes.

## Etapa 1 — proteção e recuperação
- Centralizar os campos persistidos e restaurar todos os módulos e anexos.
- Validar o arquivo antes de gravar; não misturar campos ausentes com a base atual.
- Baixar cópia de recuperação antes da restauração.
- Propagar falhas de gravação; permitir exportação mesmo sem espaço local.
- Preservar conteúdo ilegível, evitando substituição automática por base vazia.
- Aceite: ida e volta integral; arquivo inválido; falta de espaço; backup antigo.

## Etapa 2 — integridade e módulos existentes
- Não reiniciar competências já abertas, inclusive futuras.
- Manter instâncias de obrigações existentes quando os grupos mudarem.
- Não executar limpeza automática de empresas ou checklists ao abrir.
- Reutilizar o componente visual existente nos indicadores de Fator R, Chamados e Clientes.
- Encaminhar pedidos de exclusão ao fluxo administrativo existente.
- Aceite: carregar novamente sem perder conclusão/observação/prazo; navegar pelos módulos; verificar pedido e aprovação de exclusão.

## Etapa 3 — prazos e configuração, entrega posterior
- Versionar grupos com vigência explícita e prévia do impacto.
- Distinguir não configurado, não aplicável e concluído.
- Unificar datas usadas pelo painel e calendário; validar cada regra fiscal em fonte oficial.
- Separar solicitações por empresa e competência.

## Etapa 4 — melhorias visuais, entrega posterior
- Ajustes pontuais de contraste, espaçamento, responsividade e teclado.
- Preservar navegação, nomes dos módulos e ações conhecidas.
- Mostrar comparação antes/depois por tela.

## Etapa 5 — base online, projeto próprio
- Autenticação de servidor, escritório e isolamento, banco e armazenamento de documentos.
- Migrar cópias primeiro; conferir contagens, vínculos, anexos e histórico.
- Validar com dois escritórios fictícios e dois dispositivos antes de migrar dados reais.
- Depois: portal, alertas, integrações e IA.

## Publicação e recuperação
Base inicial: commit 8cd24ec, branch feat/render-saas-core-2026-10-06.
As etapas 1 e 2 não alteram CSS, telas de login, chave de armazenamento ou banco remoto.
Os testes usam dados sintéticos em navegador isolado. Não acessam os dados do navegador do usuário.
O backup dos dados reais precisa ser exportado no navegador onde o usuário trabalha.
Retorno de código: reverter o commit de proteção; não usar reset destrutivo.
Restaurar dados apenas a partir de backup verificado e com cópia anterior preservada.
Não foi prometida sincronização entre computadores nesta entrega.

Limite intencional: grupos alterados são usados para competências ainda não criadas. Competências existentes ficam preservadas; vigência e aplicação retroativa controlada pertencem à etapa 3.
