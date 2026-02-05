"use client";

import Container from "../shared/container";
import Logo from "../shared/logo";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ColorModeToggle } from "../buttons/color-mode-button";
import { LanguageSwitcherDropdown } from "../buttons/language-switcher-button";
import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type NavLink = {
    title: string;
    href: string;
};

export default function RootHeader() {
    const locale = useLocale();
    const pathname = usePathname();
    const { data, status } = useSession();
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated" && !!data?.user;
    const links: NavLink[] = [
        {
            title: locale === "en" ? "Home" : "الرئيسية",
            href: "/",
        },
        {
            title: locale === "en" ? "Programs" : "البرامج",
            href: "/programs",
        },
        {
            title: locale === "en" ? "About" : "من نحن",
            href: "/about",
        },
        {
            title: locale === "en" ? "Contact" : "اتصل بنا",
            href: "/contact",
        },
    ];

    function isActive(href: string) {
        if (href === "/") {
            // Home must match exactly the locale root
            return pathname === "/" || pathname === `/${locale}`;
        }

        return pathname.startsWith(href);
    }
    
    function handleSignOut() {
        if (isLoading) return;
        signOut();
    }

    return (
        <header className="w-full h-16 border-b bg-background">
            <Container className="flex h-full items-center justify-between  gap-8">
                {/* Logo */}
                <Logo />

                <nav className="flex items-center justify-end md:justify-between flex-1">
                    {/* Desktop Links */}
                    <ul className="hidden md:flex items-center gap-6">
                        {links.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        isActive(link.href)
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {link.title}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        {/* Theme & Language */}
                        <ColorModeToggle />
                        <LanguageSwitcherDropdown />

                        {/* Desktop Auth Buttons */}
                        <div className="hidden md:flex items-center gap-2">
                            {!isAuthenticated && <>
                                <Button variant="gold" asChild>
                                    <Link href="/sign-in">
                                        {locale === "en" ? "Login" : "تسجيل الدخول"}
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href="/sign-up">
                                        {locale === "en" ? "Sign Up" : "إنشاء حساب"}
                                    </Link>
                                </Button>
                            </>}

                            {isAuthenticated && <>
                                <Button variant="gold" asChild>
                                    <Link href="/profile">
                                        {locale === "en" ? "Profile" : "الملف الشخصي"}
                                    </Link>
                                </Button>

                                <Button variant="ghost" type="button" onClick={handleSignOut}>
                                    {locale === "en" ? "Logout" : "تسجيل الخروج"}
                                </Button>
                            </>}
                        </div>

                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label="Open menu">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align={locale === "en" ? "end" : "start"} className="w-56">
                                    {links.map((link) => (
                                        <DropdownMenuItem key={link.href} asChild>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "w-full",
                                                    isActive(link.href) && "font-semibold text-primary"
                                                )}
                                            >
                                                {link.title}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}

                                    <div className="my-2 h-px bg-border" />

                                    {/* Mobile Auth */}
                                    <DropdownMenuItem asChild>
                                        <Link href="/sign-in">
                                            {locale === "en" ? "Login" : "تسجيل الدخول"}
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/sign-up">
                                            {locale === "en" ? "Sign Up" : "إنشاء حساب"}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </nav>

            </Container>
        </header>
    );
}
