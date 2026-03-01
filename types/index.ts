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
    maxRetries?: number;
    delayBetweenRequests?: number;
}


export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
/**
 * Program search filter options
 */
export interface ProgramSearchOptions extends PaginationOptions {
    university?: string;
    program?: string;
    degree?: string;
    language?: string;
    campus?: string;
    minPrice?: number;
    maxPrice?: number;
    termId?: string;
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
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Scrape result with metadata
 */
export interface ScrapeResult<T = ProgramScrapingType[]> {
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
export interface FilterFieldsScrapingType {
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
}

export interface ProgramScrapingType {
    id: string;
    programName: string;
    alternativeProgramName: string;
    universityName: string;
    universityLogo: string;
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
// --- Error Response ---

export interface ApiErrorResponse {
    error: string;
    details?: string;
}

// ============================================================================
// RE-EXPORTS FROM MODELS (for convenience)
// ============================================================================
export type ContextUser = {
    id: string;
    email: string;
    name: string;
    imageUrl?: string;
    role: "user" | "staff" | "admin";
    isVerified: boolean;
};
