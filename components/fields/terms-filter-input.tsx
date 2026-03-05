"use client"

import React, { useCallback, useState } from 'react'
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '../ui/select'
import { useTerms } from '@/hooks/use-terms'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'

interface TermsFilterInputProps {
    placeholder?: string
    className?: string
    baseUrl?: string
    paramName?: string
    showClearButton?: boolean
    clearButtonText?: string
    includeAllOption?: boolean
    allOptionText?: string
    onFilter?: (termId: string) => void
    autoSubmit?: boolean
    debounceMs?: number
    disabled?: boolean
    label?: string
}

function TermsFilterInput({
    placeholder = "Select a term",
    className = "",
    baseUrl = "",
    paramName = "termId",
    includeAllOption = true,
    allOptionText = "All Terms",
    onFilter,
    disabled = false,
    label
}: TermsFilterInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getTerms } = useTerms();
    const locale = useLocale()
    // Get initial term from URL
    const initialTermId = searchParams.get(paramName) || ""

    const [selectedTermId, setSelectedTermId] = useState(initialTermId)


    // Fetch terms
    const { data, isLoading } = getTerms()
    const terms = data?.rows || []


    // Handle filter submission
    const handleFilter = useCallback((termId: string) => {
        // Create new URLSearchParams from current params
        const params = new URLSearchParams(searchParams.toString())

        if (termId && termId !== 'all') {
            params.set(paramName, termId)
            // Reset to first page when filtering
            params.set("page", "1")
        } else {
            params.delete(paramName)
        }

        // Construct the URL
        const basePath = baseUrl.split('?')[0]
        const queryString = params.toString()
        const url = queryString ? `${basePath}?${queryString}` : basePath

        // Update URL
        router.push(url)

        // Call onFilter callback if provided
        if (onFilter) {
            onFilter(termId)
        }
    }, [baseUrl, paramName, searchParams, router, onFilter])

    // Handle selection change
    const onValueChange = useCallback((value: string) => {
        setSelectedTermId(value)
        if (value === 'all') {
            setSelectedTermId('')
            handleFilter('')
        }
        handleFilter(value);
    }, [handleFilter])


    return (
        <div className='flex flex-col justify-between h-16'>
            {label && (
                <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    {label}
                </label>
            )}
            <Select
                value={selectedTermId}
                onValueChange={onValueChange}
                disabled={disabled || isLoading}
                dir={locale === "ar" ? "rtl" : "ltr"}
            >
                <SelectTrigger
                    className={className}
                    aria-label={placeholder}
                    style={{ width: "100%" }}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {includeAllOption && (
                        <SelectItem value="all">
                            {allOptionText}
                        </SelectItem>
                    )}
                    {terms.map((term) => (
                        <SelectItem
                            key={term._id.toString()}
                            value={term._id.toString()}
                        >
                            {term.name}
                        </SelectItem>
                    ))}
                    {terms.length === 0 && !isLoading && (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No terms available
                        </div>
                    )}
                    {isLoading && (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            Loading terms...
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}

export default TermsFilterInput