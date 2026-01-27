import { proxyFetch } from "./_utils";

export default async function handler(req, res) {
  try {
    const query = req.url.split("?")[1] || "";

    const data = await proxyFetch(
      `/api/spaces?${query}`
    );

    res.status(200).json(data);
  } catch (err) {
    console.error("SPACES ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
}
