import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/v1/* is rewritten to the deployed backend (see next.config.ts). Its
  // CORS allowlist has no localhost entry and rejects with a 500, so drop the
  // browser's Origin header before the rewrite forwards the request.
  if (pathname.startsWith('/api/')) {
    const headers = new Headers(request.headers);
    headers.delete('origin');
    return NextResponse.next({ request: { headers } });
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = request.cookies.get('admin_token')?.value;

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
