import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // ✅ Vercel / production дээр заавал хэрэгтэй (cookie decrypt/verify)
  secret: process.env.AUTH_SECRET,

  // ✅ Proxy/host дээр ажиллуулахад хэрэгтэй байдаг (Vercel дээр safe)
  trustHost: true,

  pages: {
    signIn: "/login",
    newUser: "/",
  },

  providers: [
    // providers-оо auth.ts дээр нэмнэ (bcrypt node-only)
  ],

  callbacks: {},
} satisfies NextAuthConfig;
