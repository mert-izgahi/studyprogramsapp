// routes/terms.route.ts
import { Hono } from "hono";
import { TermService } from "@/services/terms.service";
import dbConnect from "@/lib/mongoose";

const termsRouter = new Hono();

termsRouter.use("/*", async (c, next) => {
    await dbConnect();
    return next();
});

termsRouter
    .get("/terms", async (c) => {
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        const search = c.req.query("search");
        const isActive = c.req.query("isActive") === "true" ? true : false;
        const data = await TermService.getTerms({ search, isActive }, { page, limit });
        return c.json({ success: true, data, message: "Terms fetched successfully" });
    })
    .get("/terms/:id", async (c) => {
        const id = c.req.param("id");
        const data = await TermService.getTerm(id);
        return c.json({ success: true, data, message: "Term fetched successfully" });
    })

export default termsRouter;
