// scripts/run-scraper.ts
/**
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/run-scraper.ts
 *   npx ts-node -r tsconfig-paths/register scripts/run-scraper.ts --term 1
 *   npx ts-node -r tsconfig-paths/register scripts/run-scraper.ts --list
 *
 * Required env vars (or .env file):
 *   MONGODB_URI       – MongoDB connection string
 *   SCRAPER_EMAIL   – Login email for partner.unitededucation.com
 *   SCRAPER_PASSWORD – Login password
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { Scraper } from "@/lib/scraper";

// ─── Load environment variables ───────────────────────────────────────────────
dotenv.config({ path: "../.env" });

// ─── Config ───────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌  MONGODB_URI is not set. Add it to your .env file.");
    process.exit(1);
}
if (!process.env.SCRAPER_EMAIL || !process.env.SCRAPER_PASSWORD) {
    console.error("❌  SCRAPER_EMAIL and SCRAPER_PASSWORD must be set.");
    process.exit(1);
}

// ─── Argument parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const termIndex = args.indexOf("--term");
const requestedTermValue = termIndex !== -1 ? args[termIndex + 1] : undefined;
const userId = (() => {
    const i = args.indexOf("--user");
    return i !== -1 ? args[i + 1] : "system";
})();

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    // 1 – Connect to MongoDB
    console.log("Connecting to MongoDB…");
    await mongoose.connect(MONGODB_URI!, {
        serverSelectionTimeoutMS: 15_000,
    });
    console.log("✅ MongoDB connected.");

    const scraper = new Scraper({
        headless: false,   // set false to watch the browser
        timeout: 120_000,
    });

    try {
        // 2 – Fetch available terms
        console.log("\nFetching available terms…");
        const terms = await scraper.getAvailableTerms();

        if (terms.length === 0) {
            console.error("❌  No terms found on the page.");
            return;
        }

        console.log("\nAvailable terms:");
        terms.forEach((t, i) =>
            console.log(`  [${i + 1}] value="${t.value}"  →  ${t.text}`)
        );

        // 3 – List-only mode
        if (listOnly) {
            console.log("\nDone (--list mode).");
            return;
        }

        // 4 – Determine which term to scrape
        let termToScrape: { value: string; text: string } | undefined;

        if (requestedTermValue) {
            termToScrape = terms.find((t) => t.value === requestedTermValue);
            if (!termToScrape) {
                console.error(
                    `❌  Term value "${requestedTermValue}" not found. ` +
                    `Run with --list to see available terms.`
                );
                return;
            }
        } else {
            // Default: scrape the first (most recent) term
            termToScrape = terms[0];
            console.log(`\nNo --term specified. Defaulting to first term: "${termToScrape!.text}"`);
        }

        // 5 – Scrape
        console.log(`\nScraping term: "${termToScrape!.text}" (value: ${termToScrape!.value})`);
        await scraper.scrapeTerm(termToScrape!.value, userId);
        console.log("\n✅ Scrape completed successfully.");
    } finally {
        await scraper.destroy();
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});