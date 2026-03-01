"use client";

import React, { PropsWithChildren } from 'react'
import { ThemeProvider } from './theme-provider';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';
import { ReactQueryProvider } from './react-query-provider';

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
            <ReactQueryProvider>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </ReactQueryProvider>
        </ThemeProvider>
    )
}

export default Providers