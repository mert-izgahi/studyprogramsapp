// validations/auth.ts
import { Locale } from "next-intl";
import { z } from "zod";

// =========================================================
// SIGN IN SCHEMA
// =========================================================
export const getSignInSchema = (locale: Locale) => {
    const enSchema = z.object({
        email: z.email("Please enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const arSchema = z.object({
        email: z.email("يرجى إدخال عنوان بريد إلكتروني صالح"),
        password: z.string().min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف"),
    })
    if (locale === "en") {
        return enSchema;
    } else if (locale === "ar") {
        return arSchema;
    }
    return enSchema
}

export type SignInSchema = z.infer<ReturnType<typeof getSignInSchema>>

// =========================================================
// SIGN UP SCHEMA
// =========================================================
export const getSignUpSchema = (locale: Locale) => {
    const enSchema = z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        email: z.email("Please enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

    const arSchema = z.object({
        firstName: z.string().min(2, "يجب أن يكون الاسم الأول على الأقل 2 أحرف"),
        lastName: z.string().min(2, "يجب أن يكون الاسم الأخير على الأقل 2 أحرف"),
        email: z.email("يرجى إدخال عنوان بريد إلكتروني صالح"),
        password: z.string().min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف"),
        confirmPassword: z.string().min(8, "يجب أن تكون كلمة المرور على الأقل 8 أحرف"),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "كلمتا المرور لا تتطابق",
        path: ["confirmPassword"],
    });
    if (locale === "en") {
        return enSchema;
    } else if (locale === "ar") {
        return arSchema;
    }
    return enSchema
}

export type SignUpSchema = z.infer<ReturnType<typeof getSignUpSchema>>

// =========================================================
// UPDATE PROFILE SCHEMA
// =========================================================

export const getUpdateProfileSchema = (locale: Locale) => {
    const enSchema = z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        imageUrl: z.string().optional(),
        phone: z.string().optional(),
        preferences: z.object({
            language: z.string(),
            notifications: z.object({
                email: z.boolean(),
                push: z.boolean(),
                sms: z.boolean(),
            }),
        }),
    });

    const arSchema = z.object({
        firstName: z.string().min(2, "يجب أن يكون الاسم الأول على الأقل 2 أحرف"),
        lastName: z.string().min(2, "يجب أن يكون الاسم الأخير على الأقل 2 أحرف"),
        imageUrl: z.string().optional(),
        phone: z.string().optional(),
        preferences: z.object({
            language: z.string(),
            notifications: z.object({
                email: z.boolean(),
                push: z.boolean(),
                sms: z.boolean(),
            }),
        }),
    });
    if (locale === "en") {
        return enSchema;
    } else if (locale === "ar") {
        return arSchema;
    }
    return enSchema
}

export type UpdateProfileSchema = z.infer<ReturnType<typeof getUpdateProfileSchema>>

// =========================================================
// UPDATE USER SCHEMA
// =========================================================
export const getUpdateUserSchema = (locale: Locale) => {
    const profileSchema = getUpdateProfileSchema(locale);
    const enSchema = profileSchema.extend({
        email: z.email("Please enter a valid email address").optional(),
        role: z.enum(["user", "staff", "admin"]).optional(),
        isActive: z.boolean().optional(),
    });

    const arSchema = profileSchema.extend({
        email: z.string().email("يرجى إدخال عنوان بريد إلكتروني صالح").optional(),
        role: z.enum(["user", "staff", "admin"]).optional(),
        isActive: z.boolean().optional(),
    });
    if (locale === "en") {
        return enSchema;
    } else if (locale === "ar") {
        return arSchema;
    }
    return enSchema
}

export type UpdateUserSchema = z.infer<ReturnType<typeof getUpdateUserSchema>>