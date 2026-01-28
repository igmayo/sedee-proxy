// pages/api/_utils.js

let cachedToken = null;
let cachedExp = 0;

export function requireKey(req, res) {
  const expected = (process.env.PROXY_KEY || "").trim();
  if (!expected) return true; // si no hay PROXY_KEY, no protegemos

  const provided = (
    req.headers["x-proxy-key"] ||
    req.query.key ||
    ""
  ).toString().trim();

  if (provided !== expected) {
    res.status(401).json({
      error: "PROXY_KEY_INVALID",
      hint: "Send x-proxy-key header or ?key=....",
      expectedLength: expected.length,
      providedLength: provided.length,
    });
    return false;
  }
  return true;
}

async function loginAndGetToken() {
  const base = (process.env.SEDEE_API_BASE || "https://api.sedee.io").trim();
  const email = (process.env.SEDEE_ADMIN_EMAIL || "").trim();
  const password = (process.env.SEDEE_ADMIN_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error("Missing SEDEE_ADMIN_EMAIL / SEDEE_ADMIN_PASSWORD");
  }

  const r = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  if (!r.ok) {
    throw new Error(`Login failed ${r.status}: ${text}`);
  }

  // Ajusta aquí si el backend usa otro nombre
  const token =
    data.accessToken ||
    data.token ||
    data?.data?.accessToken;

  if (!token) {
    throw new Error(`Login OK but no token in body. Body was: ${text}`);
  }

  // cache 15 min por defecto (o menos si quieres)
  cachedToken = token;
  cachedExp = Date.now() + 15 * 60 * 1000;

  return token;
}

async function getToken(force = false) {
  if (!force && cachedToken && Date.now() < cachedExp) return cachedToken;
  return loginAndGetToken();
}

export async function forward(req, res, path) {
  if (!allowCors(req, res)) return;
  if (!requireKey(req, res)) return;

  const base = (process.env.SEDEE_API_BASE || "https://api.sedee.io").trim();
  const url = new URL(base + path);

  // pasa query params (menos key)
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k === "key") continue;
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  // 1er intento con token cacheado
  let token = await getToken(false);

  async function doFetch(tok) {
    return fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${tok}`,
        "Accept": "application/json",
      },
    });
  }

  let upstream = await doFetch(token);

  // si 401, forzamos relogin y repetimos una vez
  if (upstream.status === 401) {
    token = await getToken(true);
    upstream = await doFetch(token);
  }

  const bodyText = await upstream.text();
  res.status(upstream.status);

  // intenta devolver JSON si aplica
  const ct = upstream.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return res.json(bodyText ? JSON.parse(bodyText) : {}); } catch {}
  }
  return res.send(bodyText);
}
export function allowCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-proxy-key");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }

  return true;
}
