import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@/lib/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      companyId?: string | null;
      permissions: string[];
      image?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    companyId?: string | null;
    permissions: string[];
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    companyId?: string | null;
    permissions: string[];
    avatarUrl?: string;
  }
}
