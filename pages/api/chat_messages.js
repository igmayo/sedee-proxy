import { forward } from "./_utils";

export default async function handler(req, res) {
  const conversationId = req.query.conversationId;
  if (!conversationId) return res.status(400).json({ error: "Missing conversationId" });

  return forward(req, res, `/api/chat/conversations/${conversationId}/messages`);
}
