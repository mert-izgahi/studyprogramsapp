// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export const routeConfig = {
    // Routes that don't require authentication
    public: [
        '/',
        '/sign-in',
        '/sign-up',
        '/forgot-password',
        '/reset-password',
        '/about',
        '/contact',
        '/terms',
        '/privacy',
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
        '/dashboard/users',
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
// REDIRECT CONFIGURATION
// ============================================================================

export const defaultRedirects = {
  signIn: '/sign-in',
  unauthorized: '/unauthorized',
  afterSignIn: '/',
};

export const authUrls = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  unauthorized: '/unauthorized',
  afterSignIn: '/',
  afterSignUp: '/',
  afterSignOut: '/',
  
};