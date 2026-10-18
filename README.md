# Mapa de restaurantes de Fortaleza

Site estático (GitHub Pages) + Supabase. A pessoa clica no restaurante, dá nota de 0 a 5, escolhe data/hora e a resposta cai na tabela `visitas`.

```
index.html          página (Leaflet + supabase-js via CDN)
config.js           URL e anon key do Supabase
restaurantes.js     lista de restaurantes (edite aqui)
fotos/              coloque as fotos aqui
supabase/schema.sql tabela + RLS
supabase/functions/avisar-telegram/   aviso opcional no Telegram
```

## 1. Supabase
1. Crie um projeto em supabase.com.
2. **SQL Editor > New query**: cole `supabase/schema.sql` e rode.
3. **Project Settings > API**: copie `Project URL` e a chave `anon public` para o `config.js`.

## 2. Restaurantes
Edite `restaurantes.js` (id, nome, bairro, lat/lng, foto, link). Para pegar lat/lng: Google Maps, botão direito no local, clique nos números. Suba as fotos em `fotos/` e use `foto: "fotos/nome.jpg"`.

## 3. GitHub Pages
```bash
git init && git add . && git commit -m "mapa de restaurantes"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mapa-restaurantes.git
git push -u origin main
```
No repositório: **Settings > Pages > Deploy from a branch > main / (root)**. O site fica em `https://SEU-USUARIO.github.io/mapa-restaurantes/`.

Teste localmente antes: `python3 -m http.server 8000` e abra `http://localhost:8000`.

## 4. Onde ver as respostas
- **Table Editor > visitas**, ou no SQL Editor (query pronta no fim do `schema.sql`, já no horário de Fortaleza).

## 5. (Opcional) Aviso no Telegram a cada resposta
1. No Telegram, fale com `@BotFather`, crie um bot e guarde o token. Mande uma mensagem para o bot e pegue seu `chat_id` (por exemplo via `@userinfobot`).
2. Com a Supabase CLI:
   ```bash
   supabase login && supabase link --project-ref SEU-REF
   supabase secrets set TELEGRAM_TOKEN=... TELEGRAM_CHAT_ID=... WEBHOOK_SECRET=uma-string-longa-aleatoria
   supabase functions deploy avisar-telegram --no-verify-jwt
   ```
3. **Database > Webhooks > Create**: tabela `visitas`, evento `INSERT`, tipo HTTP Request, método POST, URL `https://SEU-REF.supabase.co/functions/v1/avisar-telegram`, header `x-webhook-secret` com o mesmo valor do secret.

## Segurança e escala (o que vale saber)
- **A anon key é pública**, e tudo bem: a proteção é o RLS. A tabela só tem policy de `INSERT`, então quem abre o site não consegue ler nem alterar nada. Nunca use a `service_role` no front.
- **Spam:** qualquer um com a URL do site pode inserir linhas. Os `CHECK` do schema limitam tamanho e valores, mas não o volume. Se o link for ficar público, o próximo passo é inserir via Edge Function com Cloudflare Turnstile e rate limit. Para uso pessoal (só você e a Marina) o risco é baixo.
- **Escala:** irrelevante aqui (poucas linhas). O índice em `criado_em` já cobre a consulta "últimas respostas".
- **Plano gratuito do Supabase pausa o projeto após cerca de 1 semana sem atividade.** Se o envio falhar de repente, entre no painel e clique em *Restore*.
- **Fotos:** hotlink de Instagram e de sites de terceiros costuma quebrar. Mantenha tudo em `fotos/`.
- Cada envio cria uma nova linha (reenviar não sobrescreve). Para ler a decisão final, use a linha mais recente por `restaurante_id`.
