import { forward } from "./_utils";

export default async function handler(req, res) {
  return forward(req, res, "/api/spaces");
}
