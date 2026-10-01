# Plano Render

## Serviço principal

Nome sugerido:

```txt
controle-empresas-web
```

Tipo:

```txt
Static Site
```

Repo:

```txt
https://github.com/marcoswilc-spec/controle-empresas-online
```

Branch:

```txt
main
```

Build Command:

```bash
npm install && npm run build
```

Publish Directory:

```txt
dist
```

## Variáveis

```env
VITE_SUPABASE_URL=https://qnqmmrvhqxpenhqyesbc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

## Depois do deploy

1. Testar login.
2. Confirmar organização e assinatura.
3. Confirmar listagem da empresa teste.
4. Testar cadastro de nova empresa.
5. Migrar documentos para Supabase Storage.
