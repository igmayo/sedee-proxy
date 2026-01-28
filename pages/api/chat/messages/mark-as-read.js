import { forwardChat } from "../../_utils";

export default async function handler(req, res) {
  // Solo acepta POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return forwardChat(req, res, "/api/chat/messages/mark-as-read");
}

