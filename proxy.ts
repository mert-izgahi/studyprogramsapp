// ./proxy.ts
import { auth } from '@/lib/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import { routeConfig,intlConfig, authUrls } from './config';



// ============================================================================
// INTERNATIONALIZATION MIDDLEWARE
// ============================================================================

const intlMiddleware = createMiddleware({
    locales: routing.locales,
    defaultLocale: intlConfig.defaultLocale,
    localePrefix: intlConfig.localePrefix,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract locale from pathname
 */
function getLocale(pathname: string): string | null {
    const segments = pathname.split('/');
    const potentialLocale = segments[1];

    if (potentialLocale && routing.locales.includes(potentialLocale as any)) {
        return potentialLocale;
    }

    return null;
}

/**
 * Remove locale prefix from pathname
 */
function removeLocalePrefix(pathname: string, locale: string | null): string {
    if (!locale) return pathname;
    return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Check if pathname matches any route in the given array
 */
function matchesRoutes(pathname: string, routes: string[]): boolean {
    return routes.some(route => {
        // Exact match
        if (pathname === route) return true;

        // Wildcard match (e.g., /admin/* matches /admin/users)
        if (route.endsWith('/*')) {
            const baseRoute = route.slice(0, -2);
            return pathname.startsWith(baseRoute);
        }

        // Nested path match
        if (pathname.startsWith(`${route}/`)) return true;

        return false;
    });
}

/**
 * Create a redirect URL with locale
 */
function createRedirectUrl(
    baseUrl: URL,
    path: string,
    locale: string,
    callbackUrl?: string
): URL {
    const url = new URL(`/${locale}${path}`, baseUrl);

    if (callbackUrl) {
        url.searchParams.set('callbackUrl', callbackUrl);
    }

    return url;
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

export default auth((req: any) => {
    const { pathname } = req.nextUrl;


    // Extract locale and clean pathname
    const locale = getLocale(pathname) || 'en';
    const cleanPathname = removeLocalePrefix(pathname, getLocale(pathname));
    
    
    // Get authentication state
    const isAuthenticated = !!req.auth;
    const userRole = req.auth?.user?.role;

    // -------------------------------------------------------------------------
    // 1. Check if route is public
    // -------------------------------------------------------------------------
    const isPublicRoute = matchesRoutes(cleanPathname, routeConfig.public);

    if (isPublicRoute) {
        // Redirect authenticated users away from auth pages
        if (isAuthenticated && [authUrls.signIn, authUrls.signUp].includes(cleanPathname)) {
            return NextResponse.redirect(
                createRedirectUrl(req.url, '/', locale)
            );
        }

        // Allow access to public routes
        return intlMiddleware(req);
    }

    // -------------------------------------------------------------------------
    // 2. Check authentication for protected routes
    // -------------------------------------------------------------------------
    if (!isAuthenticated) {

        return NextResponse.redirect(
            createRedirectUrl(req.url, authUrls.signIn, locale, pathname)
        );
    }

    // -------------------------------------------------------------------------
    // 3. Check admin routes
    // -------------------------------------------------------------------------
    const isAdminRoute = matchesRoutes(cleanPathname, routeConfig.admin);

    if (isAdminRoute && userRole !== 'admin') {
        return NextResponse.redirect(
            createRedirectUrl(req.url, authUrls.unauthorized, locale)
        );
    }

    // -------------------------------------------------------------------------
    // 4. Check staff routes (staff or admin)
    // -------------------------------------------------------------------------
    const isStaffRoute = matchesRoutes(cleanPathname, routeConfig.staff);

    if (isStaffRoute && userRole !== 'admin' && userRole !== 'staff') {
        return NextResponse.redirect(
            createRedirectUrl(req.url, authUrls.unauthorized, locale)
        );
    }

    // -------------------------------------------------------------------------
    // 5. Apply internationalization
    // -------------------------------------------------------------------------
    return intlMiddleware(req);
});

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Files with extensions (.jpg, .png, .svg, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
        '/',
        '/(ar|en)/:path*',
    ],
};