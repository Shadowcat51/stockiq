import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add the paths that require authentication here
const protectedPaths = ['/dashboard', '/settings', '/portfolio'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Check for the refresh token cookie
  const hasRefreshToken = request.cookies.has('refreshToken');

  if (isProtectedPath && !hasRefreshToken) {
    // If trying to access a protected route without a token, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  if (isAuthPath && hasRefreshToken) {
    // If trying to access login/register while already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
