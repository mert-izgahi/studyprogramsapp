/**
 * Configuration options for browser initialization
 */
export interface BrowserConfig {
    headless?: boolean;
    slowMo?: number;
    timeout?: number;
    viewport?: {
        width: number;
        height: number;
    };
    userAgent?: string;
}

/**
 * Login credentials and options
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginOptions extends BrowserConfig {
    loginUrl?: string;
}

/**
 * Program data structure
 */
export interface Program {
    id: string;
    programName: string;
    alternativeProgramName: string;
    universityName: string;
    universityId: string;
    programDegree: string;
    language: string;
    campus: string;
    tuitionFee: number;
    discountedTuitionFee: number;
    currency: string;
    depositPrice: number;
    prepSchoolFee: number;
    cashPaymentFee?: string;
    quotaFull: boolean;
    semester: string;
    termSettings: string;
    academicYear: string;
}

/**
 * Available filter fields
 */
export interface FilterFields {
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
}

/**
 * Program search filter options
 */
export interface ProgramSearchOptions {
    university?: string;
    program?: string;
    degree?: string;
    language?: string;
    campus?: string;
    minPrice?: number;
    maxPrice?: number;
    termId?: string;
    page?: number;
    recordsPerPage?: number;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
}

/**
 * Scrape result with metadata
 */
export interface ScrapeResult<T = Program[]> {
    data: T;
    pagination?: PaginationInfo;
    timestamp: Date;
    filters?: ProgramSearchOptions;
}

/**
 * Error types for better error handling
 */
export enum ScraperErrorType {
    INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
    LOGIN_ERROR = 'LOGIN_ERROR',
    NAVIGATION_ERROR = 'NAVIGATION_ERROR',
    SCRAPING_ERROR = 'SCRAPING_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
}

export class ScraperError extends Error {
    constructor(
        public type: ScraperErrorType,
        message: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'ScraperError';
    }
}