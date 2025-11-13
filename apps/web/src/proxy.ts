import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy: Handle authentication and route protection
 * Replaces deprecated middleware convention
 *
 * Redirects to /auth/login if token is missing or expired for protected routes
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/account', '/admin'];

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;

    if (accessToken === null || accessToken === undefined || accessToken === '') {
      // Redirect to login if no token
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Verify token is not expired (basic check by parsing JWT)
    try {
      // Extract payload from JWT (format: header.payload.signature)
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        // Invalid token format
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }

      // Decode payload
      const base64Url = parts[1];
      if (base64Url === null || base64Url === undefined || base64Url === '') {
        // Missing payload
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = Buffer.from(base64, 'base64').toString();
      const jsonPayload = JSON.parse(decodedPayload) as Record<string, unknown>;

      // Check expiration
      const exp = jsonPayload.exp;
      if (typeof exp === 'number') {
        const isExpired = exp * 1000 < Date.now();

        if (isExpired) {
          // Token expired, redirect to login
          const url = new URL('/auth/login', request.url);
          url.searchParams.set('redirect', pathname);
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      // Error parsing token, redirect to login
      console.error('Token parsing error:', error);
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Define which routes this proxy applies to
export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/admin/:path*'],
};
