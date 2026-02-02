import { BrowserManager } from './BrowserManager';
import type { LoginCredentials, LoginOptions } from '../types';
import { ScraperError, ScraperErrorType } from '../types';

/**
 * Service for handling authentication with United Education platform
 */
export class AuthenticationService extends BrowserManager {
    private readonly credentials: LoginCredentials;
    private readonly loginUrl: string;
    private isAuthenticated: boolean = false;

    private static readonly DEFAULT_LOGIN_URL = 'https://partner.unitededucation.com/Account/Login/';
    private static readonly SELECTORS = {
        FORM: '#kt_sign_in_form',
        EMAIL: '#Email',
        PASSWORD: '#Password',
        SUBMIT: '#kt_sign_in_submit',
        ERROR: '.text-danger',
    };

    constructor(credentials: LoginCredentials, options: LoginOptions = {}) {
        super(options);
        this.credentials = credentials;
        this.loginUrl = options.loginUrl || AuthenticationService.DEFAULT_LOGIN_URL;
    }

    /**
     * Perform login
     */
    async login(): Promise<boolean> {
        this.ensureInitialized();

        try {
            console.log('Starting login process...');

            // Navigate to login page
            await this.navigateTo(this.loginUrl);

            // Wait for login form
            await this.waitForSelector(AuthenticationService.SELECTORS.FORM);
            console.log('Login form found');

            // Fill credentials
            await this.fillCredentials();

            // Submit form
            await this.submitLoginForm();

            // Verify login success
            const success = await this.verifyLoginSuccess();

            if (success) {
                this.isAuthenticated = true;
                console.log('Login successful!');
            }

            return success;
        } catch (error) {
            throw new ScraperError(
                ScraperErrorType.LOGIN_ERROR,
                'Login failed',
                error as Error
            );
        }
    }

    /**
      * Fill in login credentials
      */
    private async fillCredentials(): Promise<void> {
        const page = this.getPage();

        // Validate credentials
        if (!this.credentials.email || !this.credentials.password) {
            throw new ScraperError(
                ScraperErrorType.LOGIN_ERROR,
                'Email and password are required'
            );
        }

        // Fill email
        await this.waitForSelector(AuthenticationService.SELECTORS.EMAIL);
        await page.type(AuthenticationService.SELECTORS.EMAIL, this.credentials.email, { delay: 100 });
        console.log('Email entered');

        // Fill password
        await this.waitForSelector(AuthenticationService.SELECTORS.PASSWORD);
        await page.type(AuthenticationService.SELECTORS.PASSWORD, this.credentials.password, { delay: 100 });
        console.log('Password entered');
    }

    /**
     * Submit login form
     */
    private async submitLoginForm(): Promise<void> {
        const page = this.getPage();

        // Wait for any dynamic content or reCAPTCHA
        await this.wait(2000);

        // Click submit button
        await page.click(AuthenticationService.SELECTORS.SUBMIT);
        console.log('Submit button clicked');

        // Wait for navigation
        try {
            await page.waitForNavigation({
                waitUntil: 'networkidle2',
                timeout: this.config.timeout,
            });
        } catch (error) {
            console.log('Navigation timeout - checking login status');
        }
    }

    /**
     * Verify login was successful
     */
    private async verifyLoginSuccess(): Promise<boolean> {
        const page = this.getPage();
        const currentUrl = page.url();

        console.log(`Current URL after login: ${currentUrl}`);

        // Check if still on login page (indicates failure)
        if (currentUrl.includes('/Account/Login')) {
            // Look for error message
            try {
                const errorMessage = await page.$eval(
                    AuthenticationService.SELECTORS.ERROR,
                    (el) => el.textContent
                );

                if (errorMessage) {
                    throw new ScraperError(
                        ScraperErrorType.LOGIN_ERROR,
                        `Login failed: ${errorMessage.trim()}`
                    );
                }
            } catch (error) {
                // No error message found, but still on login page
                throw new ScraperError(
                    ScraperErrorType.LOGIN_ERROR,
                    'Login failed - still on login page'
                );
            }
        }

        return true;
    }

    /**
     * Check if user is authenticated
     */
    isLoggedIn(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Logout (clear session)
     */
    async logout(): Promise<void> {
        this.isAuthenticated = false;
        await this.close();
    }
}