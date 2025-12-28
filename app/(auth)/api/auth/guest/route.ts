import { NextResponse } from "next/server";
import { auth, signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get("redirectUrl") || "/";

    const session = await auth();
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return signIn("guest", { redirectTo: redirectUrl });
  } catch (err) {
    console.error("[guest route] error:", err);
    return NextResponse.json(
      { error: "GUEST_SIGNIN_FAILED" },
      { status: 500 }
    );
  }
}
