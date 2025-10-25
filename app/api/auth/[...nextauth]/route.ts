// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with:", credentials);

        if (!credentials?.email || !credentials?.password) return null;

        const employee = await db.employee.findUnique({
          where: { email: credentials.email },
        });

        if (!employee || !employee.hashedPassword) {
          console.log("❌ Employee not found or password missing");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          employee.hashedPassword
        );

        if (!isValid) {
          console.log("❌ Password mismatch");
          return null;
        }

        console.log("✅ Login successful for:", employee.email);

        return {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          role: employee.role,
          companyId: employee.companyId,
          permissions: employee.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role as Role;
        token.companyId = (user as any).companyId;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.companyId = token.companyId;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
    async redirect({ url, baseUrl, token }: { url: string; baseUrl: string; token?: JWT }) {
      if (token?.role === "SUPER_ADMIN") return `${baseUrl}/super-admin/dashboard`;
      if (token?.companyId) {
        if (token.role === "COMPANY_ADMIN") return `${baseUrl}/company/${token.companyId}/dashboard`;
        if (token.role === "COMPANY_HR") return `${baseUrl}/company/${token.companyId}/hr/dashboard`;
        if (token.role === "EMPLOYEE") return `${baseUrl}/employee/${token.companyId}/profile`;
      }
      return url;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
