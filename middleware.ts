import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const pathname = new URL(request.url).pathname

  // Przekaż pathname do server components przez header (używane w layout.tsx do role-based redirect)
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  if (isPublicRoute(request)) return response

  const { userId } = await auth.protect()

  // Admin route — soft check przez env var; twarda weryfikacja przez RLS w server actions
  if (isAdminRoute(request)) {
    const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
    if (adminUserId && userId !== adminUserId) {
      return NextResponse.redirect(new URL('/moja-organizacja', request.url))
    }
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
