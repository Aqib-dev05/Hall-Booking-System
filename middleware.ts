import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if (isDashboardRoute || isAdminRoute) {
    // 1. Redirect unauthenticated users to /login
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      // Optional: Pass redirect URL to login
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Protect /admin/* routes, requiring the 'admin' role
    if (isAdminRoute && req.auth?.user?.role !== "admin") {
      // Redirect unauthorized users to /dashboard or a 403 page
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

// Matcher paths that will trigger this middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
