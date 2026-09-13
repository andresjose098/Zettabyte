import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function verificarAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.ADMIN_SESSION_SECRET
    );

    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "ADMIN") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}