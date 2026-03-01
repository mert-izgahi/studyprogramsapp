// routes/programs.route.ts
import { Hono } from "hono";
import { ProgramService } from "@/services/program.service";
import dbConnect from "@/lib/mongoose";

const programsRouter = new Hono();

programsRouter.use("/*", async (c, next) => {
    await dbConnect();
    return next();
});

programsRouter
    .get("/programs", async (c) => {
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "20");
        const search = c.req.query("search");
        const universities = c.req.query("universities");

        const data = await ProgramService.getPrograms({
            search,
            universities,
        }, {
            page,
            limit,
        });
        return c.json({ success: true, data, message: "Programs fetched successfully" });
    })
    .get("/filter-options", async (c) => {
        const termId = c.req.query("termId");
        if (!termId) {
            return c.json({ success: false, message: "termId is required" });
        }
        const data = await ProgramService.getFilterOptions(termId);
        return c.json({ success: true, data, message: "Filter options fetched successfully" });
    });



export default programsRouter;