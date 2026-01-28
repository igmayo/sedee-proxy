import { forward } from "../../../_utils";

export default function handler(req, res) {
  return forward(req, res, "/api/users/paginated/paginated");
}
