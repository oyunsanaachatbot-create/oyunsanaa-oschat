import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // health check
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // auth route-уудыг middleware оролдохгүй
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // static / public
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // session шалгана (getToken хэрэглэхгүй)
  const session = await auth();

  // нэвтрээгүй бол guest рүү явуулна
  if (!session) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
