import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase();

  // Block common WordPress / hack scan paths
  if (
    pathname.startsWith('/wp-') ||
    pathname.startsWith('/wp-admin') ||
    pathname.includes('install.php') ||
    pathname.includes('wp-login') ||
    pathname.includes('xmlrpc')
  ) {
    // Safe IP logging without using request.ip
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    console.log(`[WP Block] ${pathname} from ${ip}`);

    return NextResponse.json({ error: 'Not Found' }, { 
      status: 404 
    });
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next.js internals, static files, and images from middleware
  matcher: '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
};