import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // API routes that require specific roles
    if (pathname.startsWith('/api/servers') && req.method !== 'GET') {
      if (token?.role !== 'admin' && token?.role !== 'dono') {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes
        if (pathname === '/login' || pathname === '/') {
          return true;
        }

        // Protected routes require authentication
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/servers/:path*',
    '/api/movies/:path*',
    '/api/series/:path*',
    '/api/live/:path*',
    '/api/epg/:path*',
    '/api/user-info/:path*',
    '/api/stream-url/:path*',
    '/api/channels/:path*',
    '/api/active-lists/:path*',
    '/api/dashboard-stats/:path*',
    '/api/users/:path*'
  ],
};