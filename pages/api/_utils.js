export function requireKey(req, res) {
   console.log("[DEBUG] PROXY_KEY env =", JSON.stringify(process.env.PROXY_KEY));
  console.log("[DEBUG] provided header x-proxy-key =", JSON.stringify(req.headers["x-proxy-key"]));
  console.log("[DEBUG] provided query key =", JSON.stringify(req.query?.key)); 
const expected = String(process.env.PROXY_KEY || "").trim();

  // Si no hay PROXY_KEY en Vercel, no exigimos key
  if (!expected) return true;

  const rawHeader = req.headers["x-proxy-key"];
  const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  const provided = String(headerValue || req.query?.key || "").trim();

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

function deepOmit(obj, keysToRemove = new Set(["password", "refreshToken"])) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((v) => deepOmit(v, keysToRemove));
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (keysToRemove.has(k)) continue;
      out[k] = deepOmit(v, keysToRemove);
    }
    return out;
  }
  return obj;
}

export function sanitizeJson(data) {
  return deepOmit(data);
}

export async function forward(req, res, path) {
  if (!requireKey(req, res)) return;

  const base = (process.env.SEDEE_API_BASE || "https://api.sedee.io").trim();
const token = (process.env.SEDEE_BEARER_TOKEN || "").trim();

const cleanToken = (token || "").trim().split(/\s+/)[0];
  if (!token) {
    return res.status(500).json({ error: "Missing SEDEE_BEARER_TOKEN env var" });
  }

  const url = new URL(base + path);
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "key") continue;
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const upstream = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${cleanToken}`,
      "Accept": "application/json",
    },
  });

  const text = await upstream.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (body && typeof body === "object") body = sanitizeJson(body);

  return res.status(upstream.status).json(body);
}
