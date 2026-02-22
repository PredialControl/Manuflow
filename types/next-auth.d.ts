import { User } from "@prisma/client";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: User["role"];
      companyId: string;
      category?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: User["role"];
    companyId: string;
    category?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: User["role"];
    companyId: string;
    category?: string | null;
  }
}
