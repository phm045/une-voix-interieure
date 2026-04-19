// Fonction éphémère pour nettoyer les visites de test. À supprimer juste après utilisation.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = Deno.env.get("SUPABASE_URL")!;
  const headers = { "apikey": key, "Authorization": `Bearer ${key}` };

  const patterns = ["FINAL-TEST%", "TEST-CATEGORIE%", "HARDEN-V4%", "FUTUR-VISITEUR%"];
  const results: Record<string, unknown> = {};
  for (const p of patterns) {
    const r = await fetch(`${url}/rest/v1/visites_log?navigateur=like.${encodeURIComponent(p)}`, {
      method: "DELETE",
      headers: { ...headers, "Prefer": "return=representation" },
    });
    const body = await r.json().catch(() => []);
    results[p] = { status: r.status, deleted: Array.isArray(body) ? body.length : body };
  }
  return new Response(JSON.stringify(results, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
});
