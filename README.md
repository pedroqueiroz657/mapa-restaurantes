# Mapa de restaurantes de Fortaleza

Site estático (GitHub Pages) + Supabase.

**Fluxo**
1. A pessoa escolhe um restaurante no mapa e **marca o dia e a hora** (etapa 1 → tabela `marcacoes`).
2. Depois, **avalia música, espaço e comida** com 0 a 5 estrelas (etapa 2 → tabela `avaliacoes`). A **nota média** é a média simples das categorias avaliadas e é calculada pelo banco.

```
index.html          página (Leaflet + supabase-js via CDN)
config.js           URL e chave do Supabase (NÃO sobrescreva ao atualizar)
restaurantes.js     lista de restaurantes
fotos/              logos/fotos
supabase/schema.sql tabelas + RLS + view de resumo
supabase/functions/avisar-telegram/   aviso opcional no Telegram
```

## Atualizando o banco (versão com duas etapas)
No Supabase, **SQL Editor > New query**: cole `supabase/schema.sql` e rode. Pode rodar mais de uma vez. A tabela antiga `visitas` deixa de ser usada (apague quando quiser: `drop table if exists public.visitas;`).

## Data marcada visível para todo mundo
Ao abrir um restaurante, o site mostra "Marcado para ..." (ou "Foi em ..." se a data já passou), em qualquer aparelho. Para isso o `schema.sql` cria a função `datas_marcadas()`, que devolve só o id, o restaurante e a data/hora da marcação mais recente de cada lugar. O recado e o restante da tabela continuam privados, porque não existe policy de SELECT. Isso significa que **quem tiver o link vê as datas marcadas**. Se a consulta falhar (por exemplo, a função ainda não foi criada), o site usa só o que está salvo no aparelho.

## Ver as respostas
No SQL Editor (as consultas estão comentadas no fim do `schema.sql`):
```sql
select restaurante_id, data_hora at time zone 'America/Fortaleza' as quando, comentario from public.marcacoes order by criado_em desc;
select restaurante_id, musica, espaco, comida, media, comentario from public.avaliacoes order by criado_em desc;
select * from public.resumo_restaurantes;  -- ranking com média por categoria
```

## Testando
- No celular ou computador de teste, abra o site, marque um dia, avalie e confira as linhas no Supabase.
- As datas marcadas vêm do banco (valem em qualquer aparelho). Já o que foi **avaliado** é lembrado só naquele aparelho. Para recomeçar um teste: apague as linhas em `marcacoes`/`avaliacoes` no Supabase e abra o site com `?reset` no final do endereço (`https://SEU-USUARIO.github.io/mapa-restaurantes/?reset`).
- Depois do teste, apague as linhas de teste em **Table Editor** (`marcacoes` e `avaliacoes`).

## Ajustes rápidos (no `index.html`, começo do script)
- `LIBERAR_NOTA_SO_APOS_A_DATA = true` → as estrelas só liberam depois do dia/hora marcados (hoje liberam logo após marcar).
- `CATEGORIAS` → nomes, dicas e ícones. Para **criar uma categoria nova**, adicione também a coluna no banco (`alter table public.avaliacoes add column ...`) e ajuste a fórmula da coluna `media`.

## Publicando
```powershell
git add index.html supabase README.md
git commit -m "fluxo marcar e avaliar"
git push
```
Atualize os arquivos um a um. Se descompactar um zip por cima da pasta, o `config.js` de modelo sobrescreve o seu.

## Aviso no Telegram (opcional)
1. Fale com `@BotFather`, crie um bot e guarde o token. Mande uma mensagem ao bot e pegue seu `chat_id` (por exemplo via `@userinfobot`).
2. Com a Supabase CLI:
   ```bash
   supabase login && supabase link --project-ref SEU-REF
   supabase secrets set TELEGRAM_TOKEN=... TELEGRAM_CHAT_ID=... WEBHOOK_SECRET=uma-string-longa-aleatoria
   supabase functions deploy avisar-telegram --no-verify-jwt
   ```
3. **Database > Webhooks > Create**, duas vezes: uma para a tabela `marcacoes` e outra para `avaliacoes`. Em ambas: evento `INSERT`, HTTP Request, POST, URL `https://SEU-REF.supabase.co/functions/v1/avisar-telegram`, header `x-webhook-secret` com o mesmo valor do secret.

## Segurança e escala
- **A chave publishable/anon é pública**, e tudo bem: a proteção é o RLS. As tabelas só têm policy de `INSERT`, então quem abre o site não lê nem altera nada. Nunca use a secret/`service_role` no front.
- **Média no banco:** a coluna `media` é gerada pelo Postgres, então o navegador não consegue enviar uma média forjada. Os `CHECK` limitam notas (0 a 5) e tamanho dos textos.
- **Spam:** qualquer um com a URL pode inserir linhas. Para uso pessoal o risco é baixo. Se o link for ficar público, o próximo passo é inserir via Edge Function com Cloudflare Turnstile e rate limit.
- **Escala:** irrelevante aqui (poucas linhas). Os índices em `criado_em` cobrem as consultas de "últimas respostas".
- **Plano gratuito do Supabase pausa o projeto após cerca de 1 semana sem atividade.** Se o envio falhar de repente, entre no painel e clique em *Restore*.
- Cada envio cria uma nova linha (remarcar ou refazer a avaliação não sobrescreve). Para a decisão final, use a linha mais recente por `restaurante_id`.
