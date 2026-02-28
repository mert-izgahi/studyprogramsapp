// types/api.ts
/**
 * API Request/Response Types
 */

// Scrape Job Types
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

// Program Types
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

// Filter Types
export interface FilterFieldsResponse {
    termId: string;
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
    lastUpdated: string;
}

// Term Types
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

// Scrape Jobs List
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

// Error Response
export interface ApiErrorResponse {
    error: string;
    details?: string;
}