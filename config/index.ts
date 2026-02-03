import { LocalePrefixMode } from "next-intl/routing";

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export const routeConfig = {
    // Routes that don't require authentication
    public: [
        '/',
        '/about',
        '/contact',
        '/terms',
        '/privacy',

        // AUTH ROUTES - MUST BE PUBLIC! (Fixed the redirect loop)
        '/sign-in',
        '/sign-up',
        '/forgot-password',
        '/reset-password',
        '/unauthorized', // Also make unauthorized page public
    ],

    // Routes that require admin role
    admin: [
        '/admin',
        '/admin/users',
        '/admin/settings',
        '/admin/scrape',
    ],

    // Routes that require staff or admin role
    staff: [
        '/users',
        '/reports',
    ],

    // Routes that require any authenticated user
    protected: [
        '/dashboard',
        '/profile',
        '/favorites',
        '/programs',
    ],
};


// ============================================================================
// AUTH URLS CONFIGURATION
// ============================================================================

export const authUrls = {
    signIn: '/sign-in',
    signUp: '/sign-up',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    unauthorized: '/unauthorized',
    afterSignIn: '/dashboard', // Redirect to dashboard after login
    afterSignUp: '/dashboard', // Redirect to dashboard after signup
    afterSignOut: '/', // Redirect to home after logout
};

// ============================================================================
// INTERNATIONALIZATION CONFIGURATION
// ============================================================================

export interface IntlConfig {
    locales: string[];
    defaultLocale: string;
    localePrefix: LocalePrefixMode;
}

export const intlConfig: IntlConfig = {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'always',
}

// ============================================================================
// COMBINED CONFIGURATION (if needed)
// ============================================================================

export const configs = {
    routeConfig,
    authUrls,
    intlConfig,
};