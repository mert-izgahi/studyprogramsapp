import { authenticate } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { ContextUser } from '@/types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handle } from 'hono/vercel';
import authRoutes from '@/routes/auth.routes';
import programsRouter from '@/routes/program.routes';
import termsRouter from '@/routes/terms.routes';

declare module "hono" {
    interface ContextVariableMap {
        user: ContextUser | null;
    }
}

const app = new Hono().basePath('/api');

// ─── Middleware: ensure DB is connected on every request ──────────────────────
app.use("*", async (c, next) => {
    await dbConnect();
    await next();
});

app.use('*', logger());
app.use('*', cors());

app.get('/health', authenticate, (c) => {
    return c.json({ success: true, timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});


app.route('/', authRoutes);
app.route('/', programsRouter);
app.route('/', termsRouter);
// Not found
app.notFound((c) =>
    c.json(
        {
            success: false,
            message: 'Endpoint not found',
            data: {
                timestamp: new Date().toISOString(),
                error: 'The requested endpoint does not exist. Please check the URL and try again.',
            },
        },
        404
    )
);

// Error
app.onError((err, c) => {
    console.error(err);
    return c.json(
        {
            success: false,
            message: 'Internal Server Error',
            data: {
                error: err instanceof Error ? err.message : "An unexpected error occurred",
                details: err instanceof Error ? err.stack : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        },
        500
    );
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);