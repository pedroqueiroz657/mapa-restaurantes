// Edge Function chamada por um Database Webhook (INSERT em public.visitas).
// Secrets necessários: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_SECRET
// Deploy: supabase functions deploy avisar-telegram --no-verify-jwt

Deno.serve(async (req) => {
  // Sem isso, qualquer pessoa que descubra a URL dispara mensagens no seu Telegram.
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("unauthorized", { status: 401 });
  }

  const { record } = await req.json();

  const quando = record.data_hora
    ? new Date(record.data_hora).toLocaleString("pt-BR", {
        timeZone: "America/Fortaleza",
        dateStyle: "full",
        timeStyle: "short",
      })
    : "sem data";
  const nota = record.nota === null || record.nota === undefined ? "sem nota" : `${record.nota}/5`;

  const text =
    `Nova resposta!\n` +
    `Restaurante: ${record.restaurante_id}\n` +
    `Nota: ${nota}\n` +
    `Quando: ${quando}` +
    (record.comentario ? `\nRecado: ${record.comentario}` : "");

  const r = await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: Deno.env.get("TELEGRAM_CHAT_ID"), text }),
  });

  return new Response(r.ok ? "ok" : "telegram error", { status: r.ok ? 200 : 502 });
});
