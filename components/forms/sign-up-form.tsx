"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { getSignUpSchema, type SignUpSchema } from '@/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useLocale } from 'next-intl';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PasswordInput } from '../fields/password-input';
import { toast } from 'sonner';

function SignUpForm() {
    const locale = useLocale();
    const schema = getSignUpSchema(locale);
    const form = useForm<SignUpSchema>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const router = useRouter();
    const onSubmit = async (data: SignUpSchema) => {
        const response = await fetch('/api/auth/sign-up', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if(!response.ok) {
            toast.error(response.statusText);
        }
        toast.success('User created successfully');
        
        const res = await signIn('credentials', {
            ...data,
            redirect: false,
        });
        if (res?.error) {
            console.log(res.error);
            
        } else {
            router.push('/');
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                <div className="grid grid-cols-2 gap-4">
                    {/* First Name */}
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {locale === 'en' ? 'First Name' : 'الاسم الأول'}
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder={locale === 'en' ? 'First Name' : 'الاسم الأول'} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Last Name */}
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {locale === 'en' ? 'Last Name' : 'الاسم الأخير'}
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder={locale === 'en' ? 'Last Name' : 'الاسم الأخير'} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
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

                {/* Confirm Password */}
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {locale === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
                            </FormLabel>
                            <FormControl>
                                <PasswordInput placeholder={locale === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" variant={"gold"}>
                    {locale === 'en' ? 'Create Account' : 'إنشاء حساب'}
                </Button>
            </form>
        </Form>
    )
}

export default SignUpForm