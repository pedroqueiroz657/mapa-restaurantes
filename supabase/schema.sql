-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run

create table if not exists public.visitas (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id text        not null check (char_length(restaurante_id) between 1 and 64),
  nota           smallint    check (nota between 0 and 5),   -- null = não avaliou (0 é uma nota válida)
  data_hora      timestamptz,                                -- null = não marcou data
  comentario     text        check (char_length(comentario) <= 500),
  criado_em      timestamptz not null default now(),
  -- precisa ter pelo menos nota OU data
  constraint nota_ou_data check (nota is not null or data_hora is not null)
);

create index if not exists visitas_criado_em_idx on public.visitas (criado_em desc);

-- Segurança: RLS ligado e SÓ existe policy de INSERT para o papel anônimo.
-- Sem policy de SELECT, a chave pública (anon) não consegue ler nada.
-- Quem lê é você, pelo painel do Supabase (que usa credenciais de admin).
alter table public.visitas enable row level security;

drop policy if exists "anon pode inserir" on public.visitas;
create policy "anon pode inserir"
  on public.visitas
  for insert
  to anon
  with check (true);

-- Para ver as respostas já no horário de Fortaleza:
-- select restaurante_id, nota,
--        data_hora at time zone 'America/Fortaleza' as quando,
--        comentario,
--        criado_em at time zone 'America/Fortaleza' as enviado_em
-- from public.visitas
-- order by criado_em desc;
