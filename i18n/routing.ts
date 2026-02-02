import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { configs } from '@/config';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: configs.intlConfig.locales,
    
    // Used when no locale matches
    defaultLocale: configs.intlConfig.defaultLocale,
});

// Lightweight wrappers around Next.js' navigation APIs
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);