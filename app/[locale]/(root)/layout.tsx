import RootHeader from '@/components/layouts/root-header'
import React, { PropsWithChildren } from 'react'

function layout({ children }: PropsWithChildren) {
    return (
        <div className='w-full min-h-full'>
            <RootHeader />
            {children}
        </div>
    )
}

export default layout