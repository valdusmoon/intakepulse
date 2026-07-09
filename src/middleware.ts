import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

const isPublicRoute = createRouteMatcher([
  '/features(.*)',
  '/legal(.*)',
  '/api/stripe/webhook',
  '/api/leads/public(.*)',
  '/api/leads/public/company(.*)',
  '/api/cron(.*)',
  '/api/inngest(.*)',
  '/api/ai(.*)',
  '/api/twilio(.*)',
  '/api/intake(.*)',
  '/intake(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/tools(.*)',
])

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const startTime = Date.now()

  // Log incoming request for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const authResult = await auth()
    const userId = req.headers.get('x-user-id') || authResult?.userId || 'anonymous'

    logger.info('API Request', {
      method: req.method,
      url: req.nextUrl.pathname,
      query: Object.fromEntries(req.nextUrl.searchParams),
      userId,
      userAgent: req.headers.get('user-agent')?.substring(0, 100),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      type: 'api_request'
    })
  }

  // Redirect authenticated users away from landing/auth pages → dashboard
  if (isAuthRoute(req)) {
    const { userId } = await auth()
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Add timing header for API routes
  const response = NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/api/')) {
    const duration = Date.now() - startTime
    response.headers.set('X-Response-Time', `${duration}ms`)

    logger.info('API Response', {
      method: req.method,
      url: req.nextUrl.pathname,
      duration,
      type: 'api_response'
    })
  }

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals, all static files, and the bare "/" marketing
    // homepage (trailing "|$"). Clerk's auth resolution has a real cost for
    // every anonymous hit — on a dev/test instance it's a full redirect
    // handshake, and it's unconditional overhead even in production — so the
    // highest-traffic anonymous page skips Clerk's middleware entirely rather
    // than paying that on every visit just to check for a logged-in user.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}