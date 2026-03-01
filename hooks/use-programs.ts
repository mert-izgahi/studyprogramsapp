"use client";

import { PaginationOptions, ProgramFilters } from '@/services/program.service';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { IProgram } from '@/models/Program';
import { PaginationInfo } from '@/types';

export interface ProgramsResponse {
    rows: IProgram[];
    pagination: PaginationInfo;
}

export interface FilterOptionResponse {
    universities: string[];
    programs: string[];
    degrees: string[];
    languages: string[];
    campuses: string[];
}

const getPrograms = (
    filters: ProgramFilters = {},
    options: PaginationOptions = {},
) => {
    return useQuery<ProgramsResponse>({
        queryKey: ['programs', filters, options], // ✅ IMPORTANT
        queryFn: async () => {
            const res = await apiClient.get('/programs', {
                params: { ...filters, ...options }
            });

            return res.data.data; // ✅ correct
        },
    });
}

const getFilterOptions = () => {
    return useQuery<FilterOptionResponse>({
        queryKey: ['filter-options'],
        queryFn: async () => {
            const res = await apiClient.get('/filter-options');
            const {data} = res.data;
            return data;
        },
    });
}

export const usePrograms = () => {
    return {
        getPrograms,
        getFilterOptions
    }
}