"use client";

import { TermFilters, TermsListResponse } from '@/services/terms.service';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ITerm } from '@/models/Term';
import { PaginationInfo, PaginationOptions } from '@/types';


const getTerms = (filters: TermFilters = {}, options: PaginationOptions = {}) => {
    return useQuery<TermsListResponse>({
        queryKey: ['terms', filters, options],
        queryFn: async () => {
            const res = await apiClient.get('/terms', {
                params: { ...filters, ...options }
            });
            const { data } = res.data;
            return data;
        },
    });
}

const getTerm = (id: string) => {
    return useQuery<ITerm | null>({
        queryKey: ['term', id],
        queryFn: async () => {
            const res = await apiClient.get(`/terms/${id}`);
            const { data } = res.data;
            return data;
        },
    });
}

export const useTerms = () => {
    return {
        getTerms,
        getTerm
    }
}