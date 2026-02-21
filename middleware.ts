import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/users") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Technician restrictions - can only access dashboard, inspections, and measurements
    if (token?.role === "TECHNICIAN") {
      const allowedPaths = ["/dashboard", "/inspections", "/contracts"];
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

      // Block access to reports, templates, settings, etc.
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Allow contracts only if accessing measurements tab
      if (pathname.startsWith("/contracts/")) {
        const contractIdMatch = pathname.match(/^\/contracts\/([^\/]+)$/);
        if (contractIdMatch) {
          // Check if tab=measurements is in the query string
          const searchParams = new URL(req.url).searchParams;
          const tab = searchParams.get("tab");

          // If not on measurements tab, redirect to it
          if (tab !== "measurements") {
            return NextResponse.redirect(new URL(`/contracts/${contractIdMatch[1]}?tab=measurements`, req.url));
          }
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/inspections/:path*",
    "/reports/:path*",
    "/templates/:path*",
    "/users/:path*",
    "/settings/:path*",
  ],
};
