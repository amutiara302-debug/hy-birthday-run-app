import { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(expected && provided && expected === provided);
}
