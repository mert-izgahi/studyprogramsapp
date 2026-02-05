"use client";

import React, { PropsWithChildren } from 'react'
import { ThemeProvider } from './theme-provider';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';

function Providers({
    children,
}: PropsWithChildren) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Toaster />
            <SessionProvider>
                {children}
            </SessionProvider>
        </ThemeProvider>
    )
}

export default Providers