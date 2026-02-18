import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    // Note: (auth) is a route group, so URLs are /signin and /signup (no /auth/ prefix)
    const publicRoutes = ["/signin", "/signup"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // If user is authenticated and tries to access auth pages, redirect to home
    if (token && isPublicRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // If user is not authenticated and tries to access protected pages
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt
         * - public folder content and static assets
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public|static|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
