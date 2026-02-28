import { Hono } from "hono";
import { getSignUpSchema } from "@/validations/auth";
import { AuthService } from "@/services/auth.service";

const authRoutes = new Hono().basePath("/auth");

authRoutes.post("/sign-up", async (c) => {
    try {
        const body = await c.req.json();
        
        const validation = getSignUpSchema("en").safeParse(body);

        if (!validation.success) {
            return c.json({
                success: false,
                message: validation.error.message,
            }, {
                status: 400,
            });
        }

        const user = await AuthService.createUser(validation.data);

        return c.json({
            success: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return c.json({ success: false, message: 'Error creating user' }, { status: 500 });
    }
});

export default authRoutes