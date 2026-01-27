module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/pages/api/_utils.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "forward",
    ()=>forward,
    "requireKey",
    ()=>requireKey,
    "sanitizeJson",
    ()=>sanitizeJson
]);
function requireKey(req) {
    const expected = process.env.PROXY_KEY;
    if (!expected) return;
    const key = req.headers["x-proxy-key"] || req.query.key;
    if (key !== expected) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
    }
}
function deepOmit(obj, keysToRemove = new Set([
    "password",
    "refreshToken"
])) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((v)=>deepOmit(v, keysToRemove));
    if (typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)){
            if (keysToRemove.has(k)) continue;
            out[k] = deepOmit(v, keysToRemove);
        }
        return out;
    }
    return obj;
}
function sanitizeJson(data) {
    return deepOmit(data);
}
async function forward(req, res, path) {
    requireKey(req);
    const base = process.env.SEDEE_API_BASE || "https://api.sedee.io";
    const token = process.env.SEDEE_BEARER_TOKEN;
    if (!token) {
        return res.status(500).json({
            error: "Missing SEDEE_BEARER_TOKEN env var"
        });
    }
    const url = new URL(base + path);
    for (const [k, v] of Object.entries(req.query)){
        if (k === "key") continue;
        if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });
    const text = await upstream.text();
    let body;
    try {
        body = text ? JSON.parse(text) : null;
    } catch  {
        body = {
            raw: text
        };
    }
    if (body && typeof body === "object") body = sanitizeJson(body);
    return res.status(upstream.status).json(body);
}
}),
"[project]/pages/api/chat_conversation_by_booking.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$_utils$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/pages/api/_utils.js [api] (ecmascript)");
;
async function handler(req, res) {
    const bookingId = req.query.bookingId;
    if (!bookingId) return res.status(400).json({
        error: "Missing bookingId"
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$api$2f$_utils$2e$js__$5b$api$5d$__$28$ecmascript$29$__["forward"])(req, res, `/api/chat/conversations/booking/${bookingId}`);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7e06c33c._.js.map