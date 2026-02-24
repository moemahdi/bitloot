import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * UUID v4 detection — 8-4-4-4-12 hex format
 * Used to 301-redirect /product/<uuid> → /product/<slug> for canonical SEO URLs.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Proxy: Handle authentication and route protection
 * Replaces deprecated middleware convention
 *
 * Redirects to /auth/login if token is missing or expired for protected routes.
 * Also 301-redirects /product/<uuid> → /product/<slug> for canonical SEO URLs.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Slug redirect: /product/<uuid> → /product/<slug> ──────────────────────
  const productMatch = /^\/product\/(.+)$/.exec(pathname);
  if (productMatch !== null) {
    const idSegment = productMatch[1] ?? '';
    if (idSegment !== '' && UUID_PATTERN.test(idSegment)) {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? 'https://api.bitloot.io';
      try {
        const res = await fetch(`${apiBase}/catalog/products/${idSegment}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const product = (await res.json()) as { slug?: string };
          if (typeof product.slug === 'string' && product.slug.length > 0) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = `/product/${product.slug}`;
            return NextResponse.redirect(redirectUrl, { status: 301 });
          }
        }
      } catch {
        // Timeout or network error — fall through and serve the UUID-based page
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

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
  matcher: ['/dashboard/:path*', '/account/:path*', '/admin/:path*', '/product/:path*'],
};
