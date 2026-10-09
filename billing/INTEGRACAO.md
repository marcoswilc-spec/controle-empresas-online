# Cobrança Mercado Pago — implantação isolada

## Definição
- Mensalidade padrão: R$ 200,00 (1 usuário incluído).
- Adicional: R$ 50,00 por usuário ativo adicional.
- Configurável exclusivamente por administrador, com vigência, histórico e auditoria.
- Número de empresas cadastradas não altera a cobrança.
- Prazo de tolerância inicialmente simulado: 5 dias, configurável.

## Segurança e isolamento
- A produção continua intacta: não importar este módulo no servidor atual até validação.
- Não modificar index.html, estado local, competências, obrigações, usuários existentes ou formato de backup.
- Nenhuma cobrança ou bloqueio deve ser ativado automaticamente.
- Não reutilizar os tokens do EmitLeve sem confirmação de conta, aplicação e isolamento de eventos.
- Credenciais Mercado Pago exclusivamente em variáveis de ambiente no backend.
- Persistência de assinantes, faturas, eventos e pagamentos em banco transacional isolado, com migração reversível.
- Login e autorização do assinante devem ser validados no backend antes da ativação do bloqueio.

## Próximos passos necessários antes da ativação
1. Criar/selecionar aplicação Controle de Empresas em Mercado Pago Developers.
2. Configurar ambiente de testes e webhook, validar x-signature, consultar pagamento na API e tratar eventos repetidos de modo idempotente.
3. Criar tabelas de assinaturas, planos, faturas com valor congelado, pagamentos, eventos e auditoria.
4. Construir rotas autenticadas de cobrança e painel de administração; proibir mudança de valores por usuário comum.
5. Confirmar forma de pagamento (PIX e cartão), fechamento, ciclo, reajustes e faturamento de usuário adicional.
6. Testar sucesso, pendência, recusa, estorno, concorrência e indisponibilidade; só após isso ativar bloqueio.
7. Validar backups e integridade de cadastro/documentos; submeter alterações à aprovação antes de merge/deploy.

## Estado da branch
Apenas fundamento isolado de precificação e teste; sem integração ativa, sem webhook instalado e sem deploy.
