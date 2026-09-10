import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";

export interface StudentSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export async function getStudentSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }

  return {
    ...session,
    user: session.user as StudentSessionUser,
  };
}
