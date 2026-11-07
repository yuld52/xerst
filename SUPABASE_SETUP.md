# Supabase para o LomusTrack

O backend salva os dados operacionais em PostgreSQL via SQLAlchemy. Para usar o Supabase, configure o `DATABASE_URL` do backend com a URL **Transaction pooler** copiada em Supabase → Connect. O Vercel executa funções serverless, então use essa conexão (normalmente porta `6543`), não a URL direta do banco. O pooler Transaction não preserva locks de sessão; por isso o Vercel não tenta alterar o schema na inicialização e o SQL precisa ser executado antes da implantação.

## Banco novo

No Supabase, abra **SQL Editor → New query**, cole e execute o arquivo [`supabase/migrations/20261107000000_lomustrack_schema.sql`](supabase/migrations/20261107000000_lomustrack_schema.sql). Ele cria o esquema atual do app, inclui as migrações ativas e bloqueia acesso às tabelas pela API REST para `anon` e `authenticated`; os dados são acessados pelo backend autenticado.

O arquivo é o schema completo atual, incluindo tabelas, índices, enums e migrações ativas do backend. Ele também habilita RLS e remove o acesso direto das roles `anon` e `authenticated`; os dados de negócio são servidos pela API autenticada do backend. Execute uma vez em um projeto Supabase vazio.

## Variáveis

Configure no serviço backend do Vercel:

- `DATABASE_URL`: URL Transaction pooler copiada do seu projeto Supabase.
- `SECRET_KEY`: segredo aleatório forte para tokens de login.
- `CRON_SECRET`: segredo aleatório forte para proteger os crons.
- `OPENROUTER_API_KEY`, credenciais Meta e chaves VAPID conforme as integrações que serão usadas.

Não coloque a senha do banco, `SUPABASE_SECRET_KEY` nem chave `service_role` em variáveis com prefixo `VITE_`. O frontend chama a API do backend; ele não conecta diretamente às tabelas de negócio.

Se já existe um banco com dados, não execute o schema inteiro por cima: faça backup e aplique somente as migrações pendentes em `reference/original-backend/database/migrations/`.
