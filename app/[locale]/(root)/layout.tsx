import RootFooter from '@/components/layouts/root-footer'
import RootHeader from '@/components/layouts/root-header'
import React, { PropsWithChildren } from 'react'

function layout({ children }: PropsWithChildren) {
    return (
        <div className='w-full flex flex-col min-h-screen'>
            <RootHeader />
            <main className='flex-1'>
                {children}
            </main>
            <RootFooter />
        </div>
    )
}

export default layout