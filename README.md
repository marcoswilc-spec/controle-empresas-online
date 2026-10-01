# Controle Empresas Online

Sistema online para controle de empresas, obrigações, documentos, clientes, equipe e assinaturas.

## Arquitetura definida

- **Render**: hospedagem principal
- **GitHub**: fonte do código
- **Supabase**: autenticação, banco e storage

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy no Render

Tipo: Static Site

Build Command:

```bash
npm install && npm run build
```

Publish Directory:

```txt
dist
```

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://qnqmmrvhqxpenhqyesbc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

## Status atual

Primeira remontagem limpa em React/Vite, com:

- login Supabase;
- identificação de organização;
- leitura de assinatura;
- dashboard;
- cadastro/listagem de empresas no Supabase.

Próxima etapa: documentos no Supabase Storage e gestão de usuários/time.
