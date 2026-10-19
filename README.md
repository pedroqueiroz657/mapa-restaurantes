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
supabase/schema.sql tabelas (marcacoes, avaliacoes, locais, edicoes_lugar) + RLS + funções + view de resumo
supabase/functions/avisar-telegram/   aviso opcional no Telegram
```

## Atualizando o banco (versão com duas etapas)
No Supabase, **SQL Editor > New query**: cole `supabase/schema.sql` e rode. Pode rodar mais de uma vez. A tabela antiga `visitas` deixa de ser usada (apague quando quiser: `drop table if exists public.visitas;`).

## Adicionar um lugar pelo site
Na lista, o botão **"Adicionar um lugar"** abre um formulário: a pessoa busca o endereço (ou toca no mapa), ajusta o pin arrastando, informa o nome e, se quiser, o endereço e o Instagram/site (`@perfil` já vale). Ao salvar, o lugar vai para a tabela `locais`, aparece para todo mundo e já abre para marcar o dia.
- Os lugares **fixos** continuam em `restaurantes.js`; os adicionados pelo site vêm do banco (função `locais_publicos()`).
- **Busca por nome:** ao buscar (por exemplo "Brayan Burger"), o site mostra até 5 opções com nome e endereço, e a pessoa toca na certa. Ele consulta duas fontes gratuitas ao mesmo tempo (Nominatim e Photon, ambas baseadas no OpenStreetMap), junta os resultados, tira os repetidos e só mostra lugares dentro do Ceará.
- **Limite da busca:** as duas fontes só conhecem o que está cadastrado no OpenStreetMap, que é feito por voluntários. Lugares comerciais pequenos podem não estar lá. Nesse caso: busque pela **rua e número**, cole as **coordenadas do Google Maps** na caixa de busca (botão direito no ponto > clicar nos números; ex.: `-3.7321, -38.4960`) ou toque no mapa.
- Sem foto por enquanto: o lugar novo mostra o quadrado colorido com a inicial. Para colocar a logo, suba a imagem em `fotos/` e acrescente o lugar em `restaurantes.js`.
- **Moderação:** para esconder um lugar indevido, rode no SQL Editor `update public.locais set ativo = false where id = '...';` (ou apague a linha em Table Editor > `locais`).
- **Proteções:** o banco limita nome/endereço/link, aceita só coordenadas dentro do Ceará e recusa mais de 30 lugares novos por hora. Quem tiver o link pode adicionar lugares, então não divulgue o endereço do site além de vocês dois.
- Para usar em outro estado ou país, ajuste os limites de `lat`/`lng` na tabela `locais` do `schema.sql`.

## Editar um lugar
Ao abrir um lugar, o link **"Editar informações"** abre o mesmo formulário do cadastro, já preenchido: nome, endereço, Instagram/site e a posição no mapa (arraste o pin, toque em outro ponto ou busque). Vale para os lugares fixos e para os adicionados pelo site.
- **Como é gravado:** o banco só aceita inserir, então cada edição vira um novo registro em `edicoes_lugar` com o **estado completo** do lugar naquele momento (um snapshot). O site sempre mostra o mais recente, e os anteriores ficam como histórico. Os dados originais (de `restaurantes.js` ou de `locais`) nunca são alterados.
- **Desfazer uma edição** (no SQL Editor, trocando o id):
  ```sql
  -- apaga só a edição mais recente (volta para a anterior ou para o original)
  delete from public.edicoes_lugar
  where id = (select id from public.edicoes_lugar where restaurante_id = 'casannas' order by criado_em desc limit 1);
  -- volta o lugar totalmente ao original
  delete from public.edicoes_lugar where restaurante_id = 'casannas';
  ```
- **Histórico:** `select * from public.edicoes_lugar where restaurante_id = 'casannas' order by criado_em desc;`
- **Confiança:** como não há login, quem tiver o link do site pode editar qualquer lugar (o mesmo vale para adicionar e marcar). O histórico garante que nada se perde e o banco limita a 60 edições por hora. Não divulgue o endereço do site além de vocês dois.
- **Fotos:** ainda não dá para trocar a foto pelo site. Para isso, suba a imagem em `fotos/` e ajuste `restaurantes.js`.
- **Importante:** se você mudar o nome ou o endereço de um lugar fixo no `restaurantes.js`, uma edição feita pelo site continua valendo por cima. Para o arquivo voltar a mandar, apague as edições daquele lugar no banco.

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
3. **Database > Webhooks > Create**, uma vez para cada tabela que quiser acompanhar: `marcacoes`, `avaliacoes`, `locais` e `edicoes_lugar`. Em ambas: evento `INSERT`, HTTP Request, POST, URL `https://SEU-REF.supabase.co/functions/v1/avisar-telegram`, header `x-webhook-secret` com o mesmo valor do secret.

## Segurança e escala
- **A chave publishable/anon é pública**, e tudo bem: a proteção é o RLS. As tabelas só têm policy de `INSERT`, então quem abre o site não lê nem altera nada. Nunca use a secret/`service_role` no front.
- **Média no banco:** a coluna `media` é gerada pelo Postgres, então o navegador não consegue enviar uma média forjada. Os `CHECK` limitam notas (0 a 5) e tamanho dos textos.
- **Spam:** qualquer um com a URL pode inserir linhas. Para uso pessoal o risco é baixo. Se o link for ficar público, o próximo passo é inserir via Edge Function com Cloudflare Turnstile e rate limit.
- **Escala:** irrelevante aqui (poucas linhas). Os índices em `criado_em` cobrem as consultas de "últimas respostas".
- **Plano gratuito do Supabase pausa o projeto após cerca de 1 semana sem atividade.** Se o envio falhar de repente, entre no painel e clique em *Restore*.
- Cada envio cria uma nova linha (remarcar ou refazer a avaliação não sobrescreve). Para a decisão final, use a linha mais recente por `restaurante_id`.
