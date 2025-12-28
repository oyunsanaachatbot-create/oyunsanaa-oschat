import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    type?: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // Regular user
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          // email/password байхгүй үед шууд fail
          if (!email || !password) {
            // timing safe
            await compare(DUMMY_PASSWORD, DUMMY_PASSWORD);
            return null;
          }

          const users = await getUser(email);

          if (!users || users.length === 0) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [user] = users;

          if (!user?.password) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const passwordsMatch = await compare(password, user.password);
          if (!passwordsMatch) return null;

          return { ...user, type: "regular" as const };
        } catch (err) {
          console.error("[auth] regular authorize error:", err);
          return null;
        }
      },
    }),

    // Guest user
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        try {
          const result = await createGuestUser();
          const guestUser = Array.isArray(result) ? result[0] : result;

          // ✅ Хоосон/алдаатай буцаалт дээр унахгүй
          if (!guestUser || !guestUser.id) {
            console.error("[auth] createGuestUser returned empty:", result);
            await compare(DUMMY_PASSWORD, DUMMY_PASSWORD);
            return null;
          }

          return {
            ...guestUser,
            email: guestUser.email ?? null,
            type: "guest" as const,
          };
        } catch (err) {
          console.error("[auth] guest authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id as string;
      if (user?.type) token.type = user.type;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? "") as string;
        session.user.type = (token.type ?? "guest") as UserType;
      }
      return session;
    },
  },
});
