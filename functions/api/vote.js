// ─────────────────────────────────────────────────────────────────────────
// Cloudflare Pages Function — Premio del Público (BAIRES MODELFEST 2026)
//
// Este archivo va en la carpeta  functions/api/vote.js  del proyecto de
// Cloudflare Pages (bamf2026-votopublico). Al desplegarse, Cloudflare
// publica automáticamente esta función en:
//
//     https://bamf2026-votopublico.pages.dev/api/vote
//
// Como queda en el MISMO dominio que la página de votación, no hace falta
// configurar ninguna URL aparte ni lidiar con CORS: la página le pega a
// "/api/vote" con una ruta relativa.
//
// La página de votación nunca ve la API Key de JotForm — vive acá, como
// variable de entorno (secreta) del proyecto de Pages.
//
// CONFIGURACIÓN NECESARIA EN CLOUDFLARE:
//   Pages → bamf2026-votopublico → Settings → Environment variables
//   → Add variable → nombre: JOTFORM_API_KEY, valor: (la misma key que
//   ya usa el dashboard, la variable JF_KEY) → marcarla como "Encrypted"
//   → guardar para Production (y Preview si lo usás) → re-deploy.
// ─────────────────────────────────────────────────────────────────────────

const JOTFORM_ID = "262565757177067";
const QID = "3"; // ID de campo (#input_3 → "numeroDe")

export async function onRequestPost({ request, env }) {
  const cors = { "Access-Control-Allow-Origin": "*" };

  let numero;
  try {
    const body = await request.json();
    numero = String(body.numero || "").trim();
  } catch (e) {
    return json({ ok: false, error: "Body inválido" }, 400, cors);
  }

  if (!numero || !/^\d+$/.test(numero)) {
    return json({ ok: false, error: "Número de modelo inválido" }, 400, cors);
  }

  if (!env.JOTFORM_API_KEY) {
    return json({ ok: false, error: "Falta configurar la variable JOTFORM_API_KEY en Cloudflare Pages" }, 500, cors);
  }

  const params = new URLSearchParams();
  params.append(`submission[${QID}]`, numero);

  try {
    const jfRes = await fetch(
      `https://api.jotform.com/form/${JOTFORM_ID}/submissions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          APIKEY: env.JOTFORM_API_KEY,
        },
        body: params.toString(),
      }
    );

    const jfJson = await jfRes.json();

    if (jfRes.ok && jfJson.responseCode === 200) {
      return json({ ok: true }, 200, cors);
    }
    return json({ ok: false, error: jfJson.message || "JotForm rechazó el envío" }, 502, cors);
  } catch (err) {
    return json({ ok: false, error: err.message }, 500, cors);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
