import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
} from "@/server/lib/auth";

describe("Auth Utilities", () => {
  it("should correctly hash and verify passwords using bcrypt", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt signature

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword!", hash);
    expect(isInvalid).toBe(false);
  });

  it("should sign and verify valid admin JWT tokens", async () => {
    const payload = {
      adminId: "65f1234567890abcdef12345",
      email: "admin@rajasthanexamtwister.com",
    };

    const token = await signAdminToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyAdminToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.adminId).toBe(payload.adminId);
    expect(verified?.email).toBe(payload.email);
  });

  it("should reject corrupted or invalid JWT tokens", async () => {
    const invalidToken = "invalid.jwt.token";
    const verified = await verifyAdminToken(invalidToken);
    expect(verified).toBeNull();
  });
});
