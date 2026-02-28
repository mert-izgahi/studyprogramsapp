// routes/scrape.route.ts
import { Hono } from "hono";
import { Scraper } from "@/lib/scraper";
import { ScraperDatabaseService } from "@/services/scraper.service";
import { ScrapeJob } from "@/models/ScrapeJob";
import { Program } from "@/models/Program";
import dbConnect from "@/lib/mongoose";

// ─── Singleton — one browser instance for the lifetime of the server ──────────
const scraper = new Scraper({
    headless:false
});

const scrapeRoutes = new Hono().basePath("/admin/scraper");

// Ensure DB is connected on every request
scrapeRoutes.use("*", async (c, next) => {
    await dbConnect();
    await next();
});

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER / SCRAPER STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/scraper/status
 * Returns live scraper process state (browser open, authenticated, currently scraping).
 */
scrapeRoutes.get("/status", (c) => {
    return c.json({ success: true, data: scraper.getStatus() });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TERMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/scraper/terms
 * Fetches available academic terms live from the United Education website.
 * Launches the browser if not already open.
 *
 * Response: { success, data: [{ value: string, text: string }] }
 */
scrapeRoutes.get("/terms", async (c) => {
    try {
        const terms = await scraper.getAvailableTerms();
        return c.json({ success: true, data: terms });
    } catch (error) {
        console.error("Error fetching terms:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch terms",
        }, 500);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCRAPE JOB — START / CANCEL / STATUS / LIST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/scraper/jobs/start
 * Starts a background scrape job for the given term.
 * Returns 202 immediately; poll /jobs/:termId for progress.
 *
 * Body: { termId: string, userId?: string }
 * Response: { success, message, data: { termId, termName } }
 */
scrapeRoutes.post("/jobs/start", async (c) => {
    try {
        const body = await c.req.json<{ termId?: string; userId?: string }>();
        const { termId, userId = "system" } = body;

        if (!termId) {
            return c.json({ success: false, message: "termId is required" }, 400);
        }

        // Guard: prevent duplicate active jobs for same term
        const existing = await ScraperDatabaseService.getScrapeJobStatus(termId);
        if (existing && ["running", "pending"].includes(existing.status)) {
            return c.json({
                success: false,
                message: `A scrape job is already ${existing.status} for this term`,
                data: existing,
            }, 409);
        }

        // Resolve term name before kicking off (validates termId too)
        const terms = await scraper.getAvailableTerms();
        const term = terms.find((t) => t.value === termId);
        if (!term) {
            return c.json({
                success: false,
                message: `Term "${termId}" not found`,
                data: { availableTerms: terms },
            }, 404);
        }

        // Fire-and-forget
        scraper.scrapeTerm(termId, userId).catch((err) => {
            console.error(`Background scrape job failed [${termId}]:`, err);
        });

        return c.json({
            success: true,
            message: "Scrape job started",
            data: { termId, termName: term.text },
        }, 202);
    } catch (error) {
        console.error("Error starting scrape job:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to start scrape job",
        }, 500);
    }
});

/**
 * POST /api/admin/scraper/jobs/cancel/:termId
 * Marks the job as cancelled in the database.
 * Note: this does NOT forcefully stop the running browser (Puppeteer does not
 * support mid-flight cancellation easily). The job will finish its current page
 * then stop updating the DB. For a hard stop, call DELETE /api/admin/scraper/browser.
 *
 * Response: { success, message }
 */
scrapeRoutes.post("/jobs/cancel/:termId", async (c) => {
    try {
        const termId = c.req.param("termId");

        const job = await ScraperDatabaseService.getScrapeJobStatus(termId);
        if (!job) {
            return c.json({ success: false, message: "Scrape job not found" }, 404);
        }
        if (job.status === "completed" || job.status === "cancelled") {
            return c.json({
                success: false,
                message: `Job is already ${job.status}`,
            }, 409);
        }

        await ScraperDatabaseService.cancelScrapeJob(termId);

        return c.json({ success: true, message: "Scrape job cancelled" });
    } catch (error) {
        console.error("Error cancelling scrape job:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to cancel job",
        }, 500);
    }
});

/**
 * GET /api/admin/scraper/jobs/:termId
 * Returns the current status + last 10 log entries for a specific job.
 *
 * Response: { success, data: ScrapeJobStatus }
 */
scrapeRoutes.get("/jobs/:termId", async (c) => {
    try {
        const termId = c.req.param("termId");
        const status = await ScraperDatabaseService.getScrapeJobStatus(termId);

        if (!status) {
            return c.json({ success: false, message: "Scrape job not found" }, 404);
        }

        return c.json({ success: true, data: status });
    } catch (error) {
        console.error("Error fetching job status:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch job status",
        }, 500);
    }
});

/**
 * GET /api/admin/scraper/jobs
 * Lists scrape jobs with optional filters and pagination.
 *
 * Query params:
 *   status  — filter by status: pending | running | completed | failed | cancelled
 *   limit   — max results (default 10, max 100)
 *   skip    — offset for pagination (default 0)
 *
 * Response: { success, data: Job[], pagination }
 */
scrapeRoutes.get("/jobs", async (c) => {
    try {
        const limit = Math.min(100, parseInt(c.req.query("limit") ?? "10", 10));
        const skip = Math.max(0, parseInt(c.req.query("skip") ?? "0", 10));
        const status = c.req.query("status");

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const [jobs, total] = await Promise.all([
            ScrapeJob.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("initiatedBy", "email firstName lastName")
                .lean(),
            ScrapeJob.countDocuments(filter),
        ]);

        return c.json({
            success: true,
            data: jobs,
            pagination: {
                total,
                limit,
                skip,
                hasNext: skip + limit < total,
                hasPrevious: skip > 0,
            },
        });
    } catch (error) {
        console.error("Error listing scrape jobs:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to list jobs",
        }, 500);
    }
});

/**
 * DELETE /api/admin/scraper/jobs/:termId
 * Hard-deletes a scrape job record from the database.
 * Only allowed for completed / failed / cancelled jobs.
 *
 * Response: { success, message }
 */
scrapeRoutes.delete("/jobs/:termId", async (c) => {
    try {
        const termId = c.req.param("termId");

        const job = await ScrapeJob.findOne({ termId });
        if (!job) {
            return c.json({ success: false, message: "Scrape job not found" }, 404);
        }
        if (["running", "pending"].includes(job.status)) {
            return c.json({
                success: false,
                message: "Cannot delete a running or pending job. Cancel it first.",
            }, 409);
        }

        await job.deleteOne();
        return c.json({ success: true, message: "Scrape job deleted" });
    } catch (error) {
        console.error("Error deleting scrape job:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to delete job",
        }, 500);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/admin/scraper/browser
 * Hard-stops the Puppeteer browser process and resets the scraper.
 * Use this as an emergency stop when cancelling a job isn't enough.
 *
 * Response: { success, message }
 */
scrapeRoutes.delete("/browser", async (c) => {
    try {
        await scraper.destroy();
        return c.json({ success: true, message: "Browser destroyed. Next request will re-initialize." });
    } catch (error) {
        console.error("Error destroying browser:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to destroy browser",
        }, 500);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRAMS — Query scraped data from MongoDB
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/scraper/programs
 * Returns scraped programs with filtering and pagination.
 *
 * Query params:
 *   termId      (required)
 *   university  — partial match (case-insensitive)
 *   degree      — partial match
 *   language    — partial match
 *   campus      — partial match
 *   minPrice    — minimum discountedTuitionFee
 *   maxPrice    — maximum discountedTuitionFee
 *   quotaFull   — "true" | "false"
 *   page        — page number (default 1)
 *   limit       — results per page (default 20, max 100)
 *
 * Response: { success, data: Program[], pagination }
 */
scrapeRoutes.get("/programs", async (c) => {
    try {
        const q = c.req.query();

        if (!q.termId) {
            return c.json({ success: false, message: "termId is required" }, 400);
        }

        const filter: Record<string, unknown> = { termId: q.termId, isActive: true };

        if (q.university) filter.universityName = { $regex: q.university, $options: "i" };
        if (q.degree) filter.programDegree = { $regex: q.degree, $options: "i" };
        if (q.language) filter.language = { $regex: q.language, $options: "i" };
        if (q.campus) filter.campus = { $regex: q.campus, $options: "i" };
        if (q.quotaFull !== undefined) filter.quotaFull = q.quotaFull === "true";

        if (q.minPrice || q.maxPrice) {
            filter.discountedTuitionFee = {
                ...(q.minPrice ? { $gte: Number(q.minPrice) } : {}),
                ...(q.maxPrice ? { $lte: Number(q.maxPrice) } : {}),
            };
        }

        const page = Math.max(1, parseInt(q.page ?? "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? "20", 10)));

        const [programs, total] = await Promise.all([
            Program.find(filter).skip((page - 1) * limit).limit(limit).lean(),
            Program.countDocuments(filter),
        ]);

        return c.json({
            success: true,
            data: programs,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Error fetching programs:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch programs",
        }, 500);
    }
});

/**
 * GET /api/admin/scraper/programs/filters
 * Returns distinct filter values for a given term sourced from saved programs.
 * Use to populate filter dropdowns in the UI.
 *
 * Query params: termId (required)
 * Response: { success, data: { universities, degrees, languages, campuses } }
 */
scrapeRoutes.get("/programs/filters", async (c) => {
    try {
        const termId = c.req.query("termId");
        if (!termId) return c.json({ success: false, message: "termId is required" }, 400);

        const base = { termId, isActive: true };

        const [universities, degrees, languages, campuses] = await Promise.all([
            Program.distinct("universityName", base),
            Program.distinct("programDegree", base),
            Program.distinct("language", base),
            Program.distinct("campus", base),
        ]);

        return c.json({ success: true, data: { universities, degrees, languages, campuses } });
    } catch (error) {
        console.error("Error fetching program filters:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch filters",
        }, 500);
    }
});

/**
 * DELETE /api/admin/scraper/programs/:termId
 * Soft-deletes (marks isActive: false) all programs for a given term.
 * Useful before re-scraping to avoid stale data.
 *
 * Response: { success, message, data: { deactivated: number } }
 */
scrapeRoutes.delete("/programs/:termId", async (c) => {
    try {
        const termId = c.req.param("termId");
        const result = await Program.updateMany({ termId }, { $set: { isActive: false } });

        return c.json({
            success: true,
            message: `Deactivated ${result.modifiedCount} programs for term ${termId}`,
            data: { deactivated: result.modifiedCount },
        });
    } catch (error) {
        console.error("Error deactivating programs:", error);
        return c.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to deactivate programs",
        }, 500);
    }
});

export default scrapeRoutes;