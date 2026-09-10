import { describe, it, expect } from "vitest";
import { signAdminToken, verifyAdminToken, AUTH_COOKIE_NAME } from "@/server/lib/token";
import { Student } from "@/server/models/Student";
import { Admin } from "@/server/models/Admin";

describe("Student and Admin Auth Isolation", () => {
  it("uses completely distinct cookie namespaces for admin vs student", () => {
    // Admin auth uses a custom httpOnly cookie
    expect(AUTH_COOKIE_NAME).toBe("auth_token");
    // NextAuth uses next-auth.session-token / __Secure-next-auth.session-token
    const nextAuthCookieDefault = "next-auth.session-token";
    expect(AUTH_COOKIE_NAME).not.toBe(nextAuthCookieDefault);
  });

  it("admin token verification rejects arbitrary student session tokens or malformed strings", async () => {
    // Simulated NextAuth token or student identifier
    const studentFakeToken = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..student_session_mock";
    const verified = await verifyAdminToken(studentFakeToken);
    expect(verified).toBeNull();
  });

  it("admin token verification rejects tokens missing adminId or email fields", async () => {
    // If a token was signed with something else, it must fail admin validation
    const emptyPayloadToken = await signAdminToken({ adminId: "", email: "" });
    const verified = await verifyAdminToken(emptyPayloadToken);
    expect(verified).toBeNull();
  });

  it("student model schema is distinct from admin model schema", () => {
    const studentSchemaPaths = Object.keys(Student.schema.paths);
    const adminSchemaPaths = Object.keys(Admin.schema.paths);

    // Student has googleId and avatarUrl; Admin has passwordHash
    expect(studentSchemaPaths).toContain("googleId");
    expect(studentSchemaPaths).toContain("avatarUrl");
    expect(studentSchemaPaths).not.toContain("passwordHash");

    expect(adminSchemaPaths).toContain("passwordHash");
    expect(adminSchemaPaths).not.toContain("googleId");
  });

  it("admin JWT payload never matches student user session schema", async () => {
    const adminPayload = {
      adminId: "admin_mongo_id_123",
      email: "admin@examtwister.com",
    };
    const token = await signAdminToken(adminPayload);
    const verified = await verifyAdminToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.adminId).toBe(adminPayload.adminId);
    // Student sessions do not have adminId
    const studentSessionUser = {
      id: "student_mongo_id_456",
      name: "Student Candidate",
      email: "student@example.com",
      image: "https://lh3.googleusercontent.com/a/mock",
    };

    expect(studentSessionUser).not.toHaveProperty("adminId");
    expect(verified).not.toHaveProperty("image");
  });
});
