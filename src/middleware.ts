import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Pass through public routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
