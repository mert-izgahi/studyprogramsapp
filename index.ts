// Updated index.ts
import { UnitedEducationScraper } from './src/UnitedEducationScraper';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

/**
 * Basic example: Login and scrape all programs
 */
async function basicExample() {
    const scraper = new UnitedEducationScraper(
        {
            email: process.env.UE_EMAIL as string,
            password: process.env.UE_PASSWORD as string,
        },
        {
            headless: false, // Keep false for debugging
            timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 60000,
        }
    );

    try {
        // Initialize browser
        console.log('Initializing scraper...');
        await scraper.initialize();

        // Login
        console.log('Logging in...');
        const loginSuccess = await scraper.login();

        if (!loginSuccess) {
            console.error('Login failed');
            return;
        }

        // Setup program search and select term
        console.log('Setting up program search...');
        const termId = await scraper.setupProgramSearch('Fall 2026-2027');
        console.log('Selected term ID:', termId);

        // Get available filters
        console.log('Getting available filters...');
        const filters = await scraper.getAvailableFilters();
        console.log('Available filters:', filters);

        // Apply filters like in your screenshot
        console.log('Applying filters...');
        await scraper.applyFilters({
            // program: 'Dentistry (English)',
            // Add other filters as needed
        });

        // Take screenshot to see current state
        await scraper.takeScreenshot('after-filters.png');

        // Scrape with filters applied
        console.log('Scraping programs with filters...');
        const result = await scraper.scrapePrograms();

        console.log('Scraping complete!');
        console.log('Total programs:', result.data.length);
        console.log('Pagination:', result.pagination);

        if (result.data.length > 0) {
            console.log('First program:', JSON.stringify(result.data[0], null, 2));
        }

        // Save to JSON file
        const fs = require('fs');
        fs.writeFileSync(
            'programs.json',
            JSON.stringify(result, null, 2)
        );
        console.log('Results saved to programs.json');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Always close the browser
        await scraper.close();
    }
}

// Run the example
basicExample();