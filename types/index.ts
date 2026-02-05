// types/index.ts
/**
 * Comprehensive type definitions for the scraper application
 * Includes scraper types, API types, and model interfaces
 */

import { IProgram } from "@/models/Program";
import { IFilterFields } from "@/models/FilterFields";

// ============================================================================
// SCRAPER TYPES
// ============================================================================

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
    universityLogo:string;
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

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// --- Scrape Job Types ---

export interface StartScrapeJobRequest {
    termId: string;
    termName: string;
    userId: string;
    credentials: {
        email: string;
        password: string;
    };
}

export interface StartScrapeJobResponse {
    message: string;
    termId: string;
    termName: string;
}

export interface ScrapeJobStatusResponse {
    termId: string;
    termName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt?: string;
    completedAt?: string;
    programsScraped: number;
    filterFieldsScraped: boolean;
    universitiesProcessed: number;
    progress: {
        currentPage: number;
        totalPages: number;
        percentage: number;
    };
    error?: string;
    logs: Array<{
        timestamp: string;
        message: string;
        level: 'info' | 'warn' | 'error';
    }>;
}

export interface GetTermsRequest {
    credentials: {
        email: string;
        password: string;
    };
}

export interface GetTermsResponse {
    terms: Array<{
        value: string;
        text: string;
    }>;
}

// --- Program Types ---

export interface ProgramsQuery {
    termId: string;
    page?: number;
    limit?: number;
    search?: string;
    university?: string;
    degree?: string;
    language?: string;
    campus?: string;
    minPrice?: number;
    maxPrice?: number;
    quotaFull?: boolean;
}

export interface ProgramsResponse {
    programs: ProgramData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export interface ProgramData {
    _id: string;
    programId: string;
    termId: string;
    programName: string;
    alternativeProgramName?: string;
    universityName: string;
    universityId: string;
    universityLogo: string;
    programDegree: string;
    language: string;
    campus: string;
    tuitionFee: number;
    discountedTuitionFee: number;
    currency: string;
    depositPrice: number;
    prepSchoolFee?: number;
    cashPaymentFee?: string;
    quotaFull: boolean;
    semester: string;
    termSettings: string;
    academicYear: string;
    lastScraped: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- Filter Types ---
export interface FilterFields {
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
}

export interface FilterFieldsResponse {
    termId: string;
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
    lastUpdated: string;
}

// --- Term Types ---

export interface TermData {
    _id: string;
    termId: string;
    name: string;
    academicYear: string;
    isActive: boolean;
    isScraped: boolean;
    programCount: number;
    lastScrapedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTermRequest {
    termId: string;
    name: string;
    academicYear: string;
}

export interface TermsResponse {
    terms: TermData[];
}

// --- Scrape Jobs List ---

export interface ScrapeJobsQuery {
    limit?: number;
    skip?: number;
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface ScrapeJobData {
    _id: string;
    termId: string;
    termName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt?: string;
    completedAt?: string;
    programsScraped: number;
    filterFieldsScraped: boolean;
    universitiesProcessed: number;
    error?: string;
    initiatedBy: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ScrapeJobsResponse {
    jobs: ScrapeJobData[];
    pagination: {
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
    };
}

// --- Error Response ---

export interface ApiErrorResponse {
    error: string;
    details?: string;
}

// ============================================================================
// RE-EXPORTS FROM MODELS (for convenience)
// ============================================================================

export type { IProgram, IFilterFields };