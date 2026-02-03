import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import Providers from "@/providers";

const font = IBM_Plex_Sans_Arabic({
    subsets: ["latin"],
    variable: "--font-ibm-plex-sans-arabic",
    display: "swap",
    weight: ["100", "200", "300", "400", "500", "600", "700"],
});


export const metadata: Metadata = {
    title: "JoodyStudy",
    description: "JoodyStudy is a platform for students to find and apply for study programs in Türkiye.",
    icons: {
        icon: "/logo.svg",
    }
};
type Props = {
    children: React.ReactNode;
    params: Promise<
        { locale: string }
    >;
};

export default async function LocaleLayout({
    children,
    params
}: Props) {
    const { locale } = await params;
    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    const messages = await getMessages();

    const bodyClasses = [
        font.className,
        'antialiased'
    ].filter(Boolean).join(' ');

    return (
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <body
                className={bodyClasses}
            >
                <NextIntlClientProvider
                    locale={locale}
                    messages={messages}
                    timeZone="Asia/Riyadh"
                >
                    <Providers>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
