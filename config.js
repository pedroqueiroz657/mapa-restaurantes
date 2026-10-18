// Supabase: Project Settings > API
// A anon key é pública por design (vai no navegador). Quem protege os dados é o RLS do schema.sql.
// NUNCA coloque a service_role key aqui.
const CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA-ANON-KEY",
  NOME: "Marina", // aparece no título da página
};
