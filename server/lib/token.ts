import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "auth_token";
const JWT_EXPIRATION = "7d";

export interface AdminJwtPayload {
  adminId: string;
  email: string;
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || "default_dev_secret_key_change_in_production_123!";
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ adminId: payload.adminId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);
    if (!payload.adminId || !payload.email) {
      return null;
    }
    return {
      adminId: String(payload.adminId),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<AdminJwtPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<AdminJwtPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}

export const AUTH_COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};
