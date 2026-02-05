"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "next-intl"

export function ColorModeToggle() {
  const { setTheme } = useTheme()
  const locale = useLocale()
  return (
    <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  align={locale === "ar" ? "end" : "start"}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {locale === "ar" ? "الوضع الفاتح" : "Light"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {locale === "ar" ? "الوضع الداكن" : "Dark"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {locale === "ar" ? "الوضع الافتراضي" : "System"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
