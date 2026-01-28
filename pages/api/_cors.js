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
