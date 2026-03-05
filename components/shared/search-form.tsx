"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Search as SearchIcon, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

interface SearchFormProps {
    placeholder?: string
    className?: string
    baseUrl?: string
    paramName?: string
    debounceMs?: number
    showSubmitButton?: boolean
    buttonText?: string
    onSearch?: (term: string) => void
    autoSubmit?: boolean
    locale?: string
}

function SearchForm({
    placeholder = "Search...",
    className = "",
    baseUrl = "",
    paramName = "search",
    debounceMs = 300,
    showSubmitButton = true,
    buttonText = "Search",
    onSearch,
    autoSubmit = false,
    locale = "en"
}: SearchFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get initial search term from URL
    const initialSearchTerm = searchParams.get(paramName) || ""

    const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
    const [isFocused, setIsFocused] = useState(false)

    // Debounce search term for auto-submit
    const debouncedSearchTerm = useDebounce(searchTerm, debounceMs)

    // Handle search submission
    const handleSearch = useCallback((term: string) => {
        // Create new URLSearchParams from current params
        const params = new URLSearchParams(searchParams.toString())

        if (term.trim()) {
            params.set(paramName, term.trim())
            // Reset to first page when searching
            params.set("page", "1")
        } else {
            params.delete(paramName)
        }

        // Construct the URL
        const basePath = baseUrl.split('?')[0]
        const queryString = params.toString()
        
        // Only add query string if there are parameters
        const url = queryString ? `${basePath}?${queryString}` : basePath

        // Update URL
        router.push(url, { scroll: false })

        // Call onSearch callback if provided
        if (onSearch) {
            onSearch(term)
        }
    }, [baseUrl, paramName, searchParams, router, onSearch])

    // Handle form submission
    const onSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        handleSearch(searchTerm)
    }, [handleSearch, searchTerm])

    // Handle input change
    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }, [])

    // Handle clear button click
    const onClear = useCallback(() => {
        setSearchTerm("")
        handleSearch("")
        // Focus the input after clearing
        const input = document.querySelector('input[type="search"]') as HTMLInputElement
        if (input) {
            input.focus()
        }
    }, [handleSearch])

    // Handle key down (for Enter key)
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !showSubmitButton) {
            e.preventDefault()
            handleSearch(searchTerm)
        }
    }, [handleSearch, searchTerm, showSubmitButton])

    // Auto-submit when debounced search term changes
    useEffect(() => {
        if (autoSubmit && debouncedSearchTerm !== initialSearchTerm) {
            handleSearch(debouncedSearchTerm)
        }
    }, [debouncedSearchTerm, autoSubmit, handleSearch, initialSearchTerm])

    // Focus handlers
    const onFocus = useCallback(() => setIsFocused(true), [])
    const onBlur = useCallback(() => setIsFocused(false), [])

    // Determine if RTL
    const isRTL = locale === 'ar' // Add other RTL locales as needed

    return (
        <form
            onSubmit={onSubmit}
            className={`relative flex w-full items-center space-x-2 ${className}`}
            role="search"
        >
            <div className={cn("relative flex-1",
                isRTL ? 'ml-2' : 'mr-2'
            )}>
                {/* Search Icon - Position based on RTL */}
                <SearchIcon
                    className={cn(
                        "absolute top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                        isRTL ? 'right-3' : 'left-3',
                        isFocused ? 'text-primary' : 'text-muted-foreground'
                    )}
                />

                {/* Input - Add padding based on RTL */}
                <Input
                    type="search"
                    value={searchTerm}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={cn(
                        isRTL ? 'pr-10' : 'pl-10', // Padding for search icon
                        searchTerm && (isRTL ? 'pl-10' : 'pr-10') // Padding for clear button
                    )}
                    aria-label={placeholder}
                />

                {/* Clear button - Position based on RTL */}
                {searchTerm && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent",
                            isRTL ? 'left-1' : 'right-1'
                        )}
                        onClick={onClear}
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                )}
            </div>

            {/* Submit button (optional) */}
            {showSubmitButton && (
                <Button
                    type="submit"
                    variant="default"
                    disabled={!searchTerm.trim()}
                >
                    {buttonText}
                </Button>
            )}
        </form>
    )
}

export default SearchForm