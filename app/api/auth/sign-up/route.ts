import { getSignUpSchema } from "@/validations/auth";
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validation = getSignUpSchema("en").safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                message: validation.error.message,
            }, {
                status: 400,
            });
        }

        const user = await AuthService.createUser(validation.data);

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ success: false, message: 'Error creating user' }, { status: 500 });
    }
}