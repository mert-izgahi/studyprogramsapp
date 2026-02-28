"use client";

import Container from '../shared/container'
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

function SubHeader() {
    const locale = useLocale();
    const pathname = usePathname();
    const adminLinks = [
        {
            name: locale === "en" ? "Dashboard" : "لوحة التحكم",
            href: '/admin'
        },
        {
            name: locale === "en" ? "Users" : "المستخدمين",
            href: '/admin/users'
        },
        {
            name: locale === "en" ? "Study Programs" : "البرامج الدراسية",
            href: '/admin/programs'
        },
        {
            name: locale === "en" ? "Terms" : "الفصول الدراسية",
            href: '/admin/terms'
        },
        {
            name: locale === "en" ? "Lists" : "القوائم",
            href: '/admin/lists'
        },
        {
            name: locale === "en" ? "Scrape Jobs" : "وظائف الاستخراج",
            href: '/admin/scrape-jobs'
        },
        {
            name: locale === "en" ? "Settings" : "الإعدادات",
            href: '/admin/settings'
        },
    ]

    const isActive = (href: string) => {
        return pathname === href;
    }

    return (
        <div className='py-4 md:py-2 border-b border-border'>
            <Container className='flex flex-col md:flex-row items-center gap-2 justify-end'>
                <ul className='flex flex-col md:flex-row items-center gap-4 flex-1 justify-between'>
                    {
                        adminLinks.map((link, index) => (
                            <li key={index} className={cn("text-sm", {
                                "underline": isActive(link.href)
                            })}>
                                <Link href={link.href}>{link.name}</Link>
                            </li>
                        ))
                    }
                </ul>
            </Container>
        </div>
    )
}

export default SubHeader