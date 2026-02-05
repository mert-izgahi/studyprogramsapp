"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcherDropdown() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    function switchLanguage(nextLocale: "en" | "ar") {
        router.replace(pathname, { locale: nextLocale });
    }

    return (
        <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Switch language">
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => switchLanguage("en")}
                    className="flex items-center gap-2"
                >
                    <span className="fi fi-gb" />
                    English
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => switchLanguage("ar")}
                    className="flex items-center gap-2"
                >
                    <span className="fi fi-sy" />
                    العربية
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
