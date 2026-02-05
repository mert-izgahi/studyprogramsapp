import { ScraperService } from "@/services/scraper.service";
import { AuthService } from "@/services/auth.service";
import { clear } from "console";
clear
async function main() {
    try {
        console.log("=== Scrape Programs ===\n");

        // Step 1: Get admin user
        console.log("1. Getting admin user...");
        const adminUser = await AuthService.getUserByEmail("admin@example.com");

        if (!adminUser) {
            console.error("✗ Admin user not found");
            process.exit(1);
        }
        console.log("✓ Admin user found:", adminUser.email);

        // Step 2: Initialize scraper
        console.log("\n2. Initializing scraper...");
        const scraperService = new ScraperService();

        await scraperService.initialize({
            email: process.env.SCRAPER_EMAIL!,
            password: process.env.SCRAPER_PASSWORD!,
        });
        console.log("✓ Scraper initialized and logged in");

        // Step 3: Scrape terms
        console.log("\n3. Scraping programs and search fields...");
        const jobIds = await scraperService.scrapeAllUnscrapedTerms(adminUser._id.toString());

        for (const jobId of jobIds) {
            // Step 4: Monitor job progress
            console.log("\n4. Monitoring job progress...");
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (attempts < maxAttempts) {
                const job = await ScraperService.getJobStatus(jobId);

                if (!job) {
                    console.error("✗ Job not found");
                    break;
                }

                console.log(`Status: ${job.status}`);

                // Show latest log
                if (job.logs && job.logs.length > 0) {
                    console.log(`Log: ${job.logs[job.logs.length - 1]}`);
                }

                if (job.status === "completed") {
                    console.log("\n✓ Job completed successfully!");
                    break;
                } else if (job.status === "failed") {
                    console.error("\n✗ Job failed!");
                    console.error("Error:", job.error);
                    console.error("All logs:", job.logs);
                    process.exit(1);
                }

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            }

            if (attempts >= maxAttempts) {
                console.error("✗ Job timed out");
                process.exit(1);
            }
        }



        // Step 5: Display results
        console.log("\n5. Fetching saved programs...");
        const terms = await ScraperService.getAllTerms();

        console.log(`\n✓ Found ${terms.length} terms in database:\n`);
        terms.forEach((term, index) => {
            console.log(`${index + 1}. ${term.name}`);
            console.log(`   Term ID: ${term.termId}`);
            console.log(`   Academic Year: ${term.academicYear}`);
            console.log(`   Is Scraped: ${term.isScraped}`);
            console.log(`   Program Count: ${term.programCount}`);
            console.log("");
        });

        console.log("=== Test Completed Successfully ===");

    } catch (error) {
        console.error("\n✗ Error occurred:");
        console.error(error);

        if (error instanceof Error) {
            console.error("\nError details:");
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
        }

        process.exit(1);
    }
}

// Run
main();