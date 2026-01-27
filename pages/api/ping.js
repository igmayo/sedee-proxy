import { requireKey } from "./_utils";

export default function handler(req, res) {
  try {
    requireKey(req);
    return res.status(200).json({ ok: true, where: "proxy" });
  } catch (e) {
    return res
      .status(e.statusCode || 500)
      .json({ message: e.message, statusCode: e.statusCode || 500 });
  }
}
