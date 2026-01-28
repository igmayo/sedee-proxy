import { forwardChat } from "../../_utils";

export default async function handler(req, res) {
  // Acepta GET y POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return forwardChat(req, res, "/api/chat/conversations/count-unread");
}

