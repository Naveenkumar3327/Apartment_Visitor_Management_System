import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define restricted routes
    const isApartmentConfigRoute = path.startsWith("/dashboard/apartments");
    const isGuardConfigRoute = path.startsWith("/dashboard/guards");
    const isResidentConfigRoute = path.startsWith("/dashboard/residents") && !path.startsWith("/dashboard/residents/profile");
    
    // Only SUPER_ADMIN and APARTMENT_ADMIN can access settings/configuration of flats, guards, and resident rosters
    if (isApartmentConfigRoute || isGuardConfigRoute || isResidentConfigRoute) {
      const allowedRoles = ["SUPER_ADMIN", "APARTMENT_ADMIN"];
      if (token && !allowedRoles.includes(token.role as string)) {
        console.warn(`Access denied to path: ${path} for role: ${token.role}`);
        return NextResponse.redirect(new URL("/dashboard?error=AccessDenied", req.url));
      }
    }

    // Only SECURITY_GUARD can access the scan scanner page
    if (path.startsWith("/dashboard/scanner")) {
      const allowedRoles = ["SUPER_ADMIN", "SECURITY_GUARD"];
      if (token && !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/dashboard?error=AccessDenied", req.url));
      }
    }
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
  ],
};
