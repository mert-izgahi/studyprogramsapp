import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from "@/services/auth.service";
import { getUpdateProfileSchema, type UpdateProfileSchema } from '@/validations/auth';
export async function GET(request: NextRequest) {
    try {
        const user = await AuthService.getCurrentUser();
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error('Error getting current user:', error);
        return NextResponse.json({ success: false, message: 'Error getting current user' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = getUpdateProfileSchema("en").safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                message: validation.error.message,
            }, {
                status: 400,
            });
        }

        const user = await AuthService.updateCurrentUser(validation.data);

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ success: false, message: 'Error updating user' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await AuthService.softDeleteCurrentUser();
        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, message: 'Error deleting user' }, { status: 500 });
    }
}

