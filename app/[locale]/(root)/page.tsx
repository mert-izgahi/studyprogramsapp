"use client";

import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";

export default function HomePage() {
    const t = useTranslations('HomePage');

    return (
        <div className="min-h-screen p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-gray-600 mt-2">{t('description')}</p>
            </header>

            <nav className="mb-8">
                <Link
                    href="/about"
                    className="mr-4 text-blue-600 hover:underline"
                >
                    {t('aboutLink')}
                </Link>
                <Link
                    href="/contact"
                    className="text-blue-600 hover:underline"
                >
                    {t('contactLink')}
                </Link>
            </nav>

            <section className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">{t('featuresTitle')}</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>{t('feature1')}</li>
                    <li>{t('feature2')}</li>
                    <li>{t('feature3')}</li>
                </ul>
            </section>

            <div className="mt-8 space-x-4">
                <Link
                    href="/"
                    locale="en"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    English
                </Link>
                <Link
                    href="/"
                    locale="ar"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    العربية
                </Link>
            </div>
        </div>
    );
}