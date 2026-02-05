import RootFooter from '@/components/layouts/root-footer'
import RootHeader from '@/components/layouts/root-header'
import SubHeader from '@/components/layouts/sub-header'
import { AuthService } from '@/services/auth.service'
import { PropsWithChildren } from 'react'

async function layout({ children }: PropsWithChildren) {
    const isAdmin = await AuthService.isAdmin();
    return (
        <div className='w-full flex flex-col min-h-screen'>
            <RootHeader />
            {isAdmin && <SubHeader />}
            <main className='flex-1'>
                {children}
            </main>
            <RootFooter />
        </div>
    )
}

export default layout