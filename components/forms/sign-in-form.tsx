"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { getSignInSchema, type SignInSchema } from '@/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLocale } from 'next-intl';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PasswordInput } from '../fields/password-input';
import { toast } from 'sonner';

function SignInForm() {
    const locale = useLocale();
    const schema = getSignInSchema(locale);
    const form = useForm<SignInSchema>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const router = useRouter();
    const onSubmit = async (data: SignInSchema) => {
        const res = await signIn('credentials', {
            ...data,
            redirect: false,
        });

        if (res?.error) {
            // Map NextAuth error codes to messages
            const errorMessages: Record<string, string> = {
                CredentialsSignin: locale === 'en' ? 'Invalid email or password' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                Default: locale === 'en' ? 'Something went wrong' : 'حدث خطأ ما',
            }

            const message = errorMessages[res.error] ?? errorMessages.Default;

            toast.error(message);
        } else {
            toast.success(locale === 'en' ? 'Signed in successfully' : 'تم تسجيل الدخول بنجاح')
            router.refresh()
            router.push('/')
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                {/* Email */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                            </FormLabel>
                            <FormControl>
                                <Input placeholder={locale === 'en' ? 'Email' : 'البريد الإلكتروني'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Password */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {locale === 'en' ? 'Password' : 'كلمة المرور'}
                            </FormLabel>
                            <FormControl>
                                <PasswordInput placeholder={locale === 'en' ? 'Password' : 'كلمة المرور'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" variant={"gold"}>
                    {locale === 'en' ? 'Sign In' : 'تسجيل الدخول'}
                </Button>
            </form>
        </Form>
    )
}

export default SignInForm