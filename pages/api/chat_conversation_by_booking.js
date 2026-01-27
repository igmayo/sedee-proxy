import { forward } from "./_utils";

export default async function handler(req, res) {
  const bookingId = req.query.bookingId;
  if (!bookingId) return res.status(400).json({ error: "Missing bookingId" });

  return forward(req, res, `/api/chat/conversations/booking/${bookingId}`);
}
