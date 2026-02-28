import SignInForm from '@/components/forms/sign-in-form';
import SignUpForm from '@/components/forms/sign-up-form';
import Container from '@/components/shared/container'
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { getLocale } from 'next-intl/server'
import React from 'react'

async function page() {
    const locale = await getLocale();


    const title = locale === 'en' ? 'Create New Account' : 'إنشاء حساب جديد';
    const desc = locale === 'en' ? 'Create a new account and start using our services' : 'إنشاء حساب جديد وبدء باستخدام خدماتنا';

    return (
        <Container className='w-full py-12'>
            <div className='max-w-xl mx-auto flex flex-col gap-8'>
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <SignUpForm />

                <div className="flex flex-col gap-4">
                    <Button asChild variant={"secondary"}>
                        <Link href="/sign-in">{locale === 'en' ? 'Sign In' : 'تسجيل الدخول'}</Link>
                    </Button>
                    
                    <Button asChild variant={"secondary"}>
                        <Link href="/forgot-password">{locale === 'en' ? 'Forgot Password? ' : 'نسيت كلمة المرور'}</Link>
                    </Button>
                </div>
            </div>
        </Container>
    )
}

export default page