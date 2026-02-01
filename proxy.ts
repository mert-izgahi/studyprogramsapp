import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';


export default createMiddleware({
    // A list of all locales that are supported
    locales: routing.locales,
    // Used when no locale matches
    defaultLocale: 'en',

    // Always use locale prefix (even for default locale)
    localePrefix: 'always'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(ar|en)/:path*']
};