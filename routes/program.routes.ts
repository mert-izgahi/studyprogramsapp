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
        const languages = c.req.query("languages");
        const campuses = c.req.query("campuses");
        const minPrice = parseInt(c.req.query("minPrice")!) || undefined;
        const maxPrice = parseInt(c.req.query("maxPrice")!) || undefined;
        

        const termId = c.req.query("termId");
        const data = await ProgramService.getPrograms({
            search,
            universities,
            languages,
            campuses,
            minPrice,
            maxPrice,
            termId
        }, {
            page,
            limit,
        });
        return c.json({ success: true, data, message: "Programs fetched successfully" });
    })
    .get("/filter-options", async (c) => {
        const data = await ProgramService.getFilterOptions();
        return c.json({ success: true, data, message: "Filter options fetched successfully" });
    });



export default programsRouter;