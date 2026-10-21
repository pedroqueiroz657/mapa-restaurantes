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
supabase/schema.sql tabelas (marcacoes, marcacoes_alteracoes, avaliacoes, locais, edicoes_lugar) + RLS + funções + view de resumo
supabase/storage.sql bucket de fotos (fotos-lugares) + regras de envio
supabase/functions/avisar-telegram/   aviso opcional no Telegram
```

## Atualizando o banco (versão com duas etapas)
No Supabase, **SQL Editor > New query**: cole `supabase/schema.sql` e rode. Pode rodar mais de uma vez. A tabela antiga `visitas` deixa de ser usada (apague quando quiser: `drop table if exists public.visitas;`).

## Adicionar um lugar pelo site
Na lista, o botão **"Adicionar um lugar"** abre um formulário: a pessoa busca o endereço (ou toca no mapa), ajusta o pin arrastando, informa o nome e, se quiser, o endereço e o Instagram/site (`@perfil` já vale). Ao salvar, o lugar vai para a tabela `locais`, aparece para todo mundo e já abre para marcar o dia.
- Os lugares **fixos** continuam em `restaurantes.js`; os adicionados pelo site vêm do banco (função `locais_publicos()`).
- **Busca por nome:** ao buscar (por exemplo "Brayan Burger"), o site mostra até 5 opções com nome e endereço, e a pessoa toca na certa. Ele consulta duas fontes gratuitas ao mesmo tempo (Nominatim e Photon, ambas baseadas no OpenStreetMap), junta os resultados, tira os repetidos e só mostra lugares dentro do Ceará.
- **Limite da busca:** as duas fontes só conhecem o que está cadastrado no OpenStreetMap, que é feito por voluntários. Lugares comerciais pequenos podem não estar lá. Nesse caso: busque pela **rua e número**, cole as **coordenadas do Google Maps** na caixa de busca (botão direito no ponto > clicar nos números; ex.: `-3.7321, -38.4960`) ou toque no mapa.
- **Foto:** o formulário tem o campo "Foto (opcional)" (veja a seção *Fotos dos lugares*). Sem foto, aparece o quadrado colorido com a inicial.
- **Moderação:** para esconder um lugar indevido, rode no SQL Editor `update public.locais set ativo = false where id = '...';` (ou apague a linha em Table Editor > `locais`).
- **Proteções:** o banco limita nome/endereço/link, aceita só coordenadas dentro do Ceará e recusa mais de 30 lugares novos por hora. Quem tiver o link pode adicionar lugares, então não divulgue o endereço do site além de vocês dois.
- Para usar em outro estado ou país, ajuste os limites de `lat`/`lng` na tabela `locais` do `schema.sql`.

## Perto de mim (ordenar por distância)
Na lista, o botão **"Perto de mim"** pede a localização do aparelho **uma vez**, no momento do toque, e então:
- ordena os lugares do mais perto ao mais longe e mostra a distância em cada linha (por exemplo "850 m" ou "1,2 km") e também ao abrir um lugar;
- mostra a posição da pessoa no mapa (ponto azul) e enquadra a pessoa com os 3 lugares mais próximos;
- **"Atualizar"** pede uma posição nova; **"Ordem original"** volta à lista normal e **esquece** a posição.

**Privacidade:** o site nunca pede a localização sozinho (só quando a pessoa toca no botão), não acompanha o deslocamento, não envia a posição para o Supabase nem para nenhum serviço, e não a guarda (só fica na memória da página; recarregar a página apaga). O navegador sempre pede permissão.

**Limites:**
- A distância é **em linha reta**, não pelo trajeto. A pé ou de carro costuma ser maior (rios, avenidas, retornos).
- No computador a localização é aproximada (Wi-Fi/IP) e pode errar de centenas de metros a alguns quilômetros; o site avisa quando a precisão é pior que 1 km. No celular, com GPS, costuma ser de 5 a 50 m.
- Se a permissão for negada, o site explica como liberar (cadeado ao lado do endereço) e continua na ordem normal. Só funciona em `https`, o que o GitHub Pages já usa.
- Se a pessoa estiver a mais de 30 km, o mapa mostra todos os lugares em vez de enquadrar a pessoa.

## Fotos dos lugares
Tanto ao **adicionar** quanto ao **editar** um lugar dá para escolher uma foto (câmera ou galeria do celular).
- **No navegador:** a foto é reduzida e convertida para JPEG antes de enviar, em duas versões: uma pequena (~240 px, usada na lista) e uma maior (~1000 px, usada no detalhe). Isso deixa o site rápido, economiza espaço e remove os metadados da foto original, inclusive a localização GPS.
- **No Supabase:** as imagens ficam no Storage, no bucket público `fotos-lugares`, com nome `<uuid>-g.jpg` e `<uuid>-p.jpg`. O registro do lugar guarda só o `<uuid>`.
- **Ordem ao salvar:** primeiro a foto, depois o registro. Se o envio da foto falhar, nada é salvo; se o registro falhar, a foto não é reenviada na nova tentativa.
- **Ativar:** no SQL Editor, rode `supabase/schema.sql` e **depois** `supabase/storage.sql`.
- **Proteções:** o bucket só aceita JPEG de até 500 KB; o público só consegue **enviar** arquivos novos com o nome no formato esperado (não lista, não sobrescreve, não apaga) e há um teto de 80 arquivos por hora (40 fotos). Para apagar uma foto indevida: painel do Supabase > **Storage > fotos-lugares**.
- **Trocar a foto de um lugar não apaga a anterior** do Storage (fica no histórico). Se quiser limpar, apague no painel.
- **iPhone/HEIC:** o Safari costuma converter para JPEG sozinho. Se alguma imagem não abrir, o site pede para tentar outra foto.
- **Espaço:** cada foto ocupa em torno de 100 a 250 KB somando as duas versões. Confira o limite do seu plano em Settings > Usage.
- **Se o envio der erro 401/"Invalid JWT":** a versão do `supabase-js` fixada no `index.html` pode ser antiga demais para as chaves novas (`sb_publishable_...`). Atualize o número da versão na tag `<script>` do jsDelivr.

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
- **Foto na edição:** "Trocar foto" no mesmo formulário. A foto nova vale por cima da original (a do `restaurantes.js` não é apagada).
- **Importante:** se você mudar o nome ou o endereço de um lugar fixo no `restaurantes.js`, uma edição feita pelo site continua valendo por cima. Para o arquivo voltar a mandar, apague as edições daquele lugar no banco.

## Datas marcadas: ver, editar e cancelar
Cada lugar pode ter **várias datas marcadas**. Ao abrir um lugar, a etapa 1 lista todas, em ordem de data ("Marcado para…" ou "Foi em…" quando já passou), cada uma com:
- **Editar:** muda o dia, a hora e o recado (o formulário abre preenchido, na própria linha).
- **Cancelar:** pede confirmação ("Sim, cancelar" / "Não") e a data some do site.
- **Marcar outra data:** cria mais uma.

**Como é gravado:** nada é sobrescrito nem apagado. A marcação original fica em `marcacoes`; cada remarcação ou cancelamento vira um evento em `marcacoes_alteracoes`, e o site mostra o estado do evento mais recente de cada data. Por isso tudo dá para desfazer pelo SQL Editor (consultas no fim do `schema.sql`):
```sql
-- histórico de remarcações e cancelamentos
select restaurante_id, acao, data_hora at time zone 'America/Fortaleza' as nova_data, comentario, criado_em, marcacao_id
from public.marcacoes_alteracoes order by criado_em desc;
-- desfazer um cancelamento/remarcação: apague o evento
delete from public.marcacoes_alteracoes where id = '...';
```
- **Selo e destaque:** a lista e o pin usam a **próxima** data que ainda vai acontecer (ou a mais recente, se todas já passaram). Com mais de uma, aparece "+1", "+2"…
- **Avaliação:** com várias datas, a avaliação fica ligada à visita **mais recente que já passou** (ou à próxima, se nenhuma passou).
- **Confiança:** sem login, quem tiver o link pode editar ou cancelar qualquer data; o histórico garante que dá para recuperar, e o banco limita a 60 alterações por hora.
- **Ativar:** rode o `supabase/schema.sql` novo antes de publicar o site. Sem a função `marcacoes_atuais`, o site usa só a cópia guardada no aparelho.

## Data marcada visível para todo mundo
Ao abrir um restaurante, o site mostra as datas marcadas em qualquer aparelho. Para isso o `schema.sql` cria a função `marcacoes_atuais()`, que devolve as datas ativas (com o recado) já considerando remarcações e escondendo as canceladas; as tabelas continuam sem policy de SELECT. Isso significa que **quem tiver o link vê as datas e os recados**. (A função antiga `datas_marcadas()` ficou no banco, sem uso.) Se a consulta falhar (por exemplo, a função ainda não foi criada), o site usa só o que está salvo no aparelho.

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
3. **Database > Webhooks > Create**, uma vez para cada tabela que quiser acompanhar: `marcacoes`, `marcacoes_alteracoes`, `avaliacoes`, `locais` e `edicoes_lugar`. Em ambas: evento `INSERT`, HTTP Request, POST, URL `https://SEU-REF.supabase.co/functions/v1/avisar-telegram`, header `x-webhook-secret` com o mesmo valor do secret.

## Segurança e escala
- **A chave publishable/anon é pública**, e tudo bem: a proteção é o RLS. As tabelas só têm policy de `INSERT`, então quem abre o site não lê nem altera nada. Nunca use a secret/`service_role` no front.
- **Média no banco:** a coluna `media` é gerada pelo Postgres, então o navegador não consegue enviar uma média forjada. Os `CHECK` limitam notas (0 a 5) e tamanho dos textos.
- **Spam:** qualquer um com a URL pode inserir linhas. Para uso pessoal o risco é baixo. Se o link for ficar público, o próximo passo é inserir via Edge Function com Cloudflare Turnstile e rate limit.
- **Escala:** irrelevante aqui (poucas linhas). Os índices em `criado_em` cobrem as consultas de "últimas respostas".
- **Plano gratuito do Supabase pausa o projeto após cerca de 1 semana sem atividade.** Se o envio falhar de repente, entre no painel e clique em *Restore*.
- Cada envio cria uma nova linha (remarcar ou refazer a avaliação não sobrescreve). Para a decisão final, use a linha mais recente por `restaurante_id`.
