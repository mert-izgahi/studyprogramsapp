// ============================================================================
// INTERNATIONALIZATION CONFIGURATION
// ============================================================================

import { LocalePrefixMode } from "next-intl/routing";

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