// Edge Function chamada por Database Webhooks (INSERT em public.marcacoes, public.avaliacoes, public.locais e public.edicoes_lugar).
// Secrets necessários: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_SECRET
// Deploy: supabase functions deploy avisar-telegram --no-verify-jwt

const fmtNota = (n: number | null) => (n === null || n === undefined ? "—" : `${n}/5`);

Deno.serve(async (req) => {
  // Sem isso, qualquer pessoa que descubra a URL dispara mensagens no seu Telegram.
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("unauthorized", { status: 401 });
  }

  const { table, record } = await req.json();
  let text: string;

  if (table === "marcacoes") {
    const quando = new Date(record.data_hora).toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
      dateStyle: "full",
      timeStyle: "short",
    });
    text =
      `Dia marcado!\n` +
      `Lugar: ${record.restaurante_id}\n` +
      `Quando: ${quando}` +
      (record.comentario ? `\nRecado: ${record.comentario}` : "");
  } else if (table === "avaliacoes") {
    text =
      `Nova avaliação!\n` +
      `Lugar: ${record.restaurante_id}\n` +
      `Música: ${fmtNota(record.musica)} | Espaço: ${fmtNota(record.espaco)} | Comida: ${fmtNota(record.comida)}\n` +
      `Média: ${record.media}` +
      (record.comentario ? `\nComo foi: ${record.comentario}` : "");
  } else if (table === "locais") {
    text =
      `Lugar novo adicionado!\n` +
      `${record.nome}` +
      (record.endereco ? `\n${record.endereco}` : "") +
      (record.link ? `\n${record.link}` : "") +
      `\nMapa: https://www.google.com/maps?q=${record.lat},${record.lng}`;
  } else if (table === "edicoes_lugar") {
    text =
      `Lugar editado!\n` +
      `${record.nome} (${record.restaurante_id})` +
      (record.endereco ? `\n${record.endereco}` : "") +
      (record.link ? `\n${record.link}` : "") +
      `\nMapa: https://www.google.com/maps?q=${record.lat},${record.lng}`;
  } else {
    return new Response("ignored", { status: 200 });
  }

  const r = await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: Deno.env.get("TELEGRAM_CHAT_ID"), text }),
  });

  return new Response(r.ok ? "ok" : "telegram error", { status: r.ok ? 200 : 502 });
});
