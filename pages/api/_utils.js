export function requireKey(req) {
  const expected = process.env.PROXY_KEY;
  if (!expected) return;
  const key = req.headers["x-proxy-key"] || req.query.key;
  if (key !== expected) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
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
  requireKey(req);

  const base = process.env.SEDEE_API_BASE || "https://api.sedee.io";
  const token = process.env.SEDEE_BEARER_TOKEN;

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
      "Authorization": `Bearer ${token}`,
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
