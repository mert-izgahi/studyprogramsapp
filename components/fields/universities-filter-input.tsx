"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePrograms } from "@/hooks/use-programs"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"

interface UniversitiesFilterInputProps {
    placeholder?: string
    baseUrl?: string
    paramName?: string
}

export default function UniversitiesFilterInput({
    placeholder = "Select universities",
    baseUrl = "",
    paramName = "universities",
}: UniversitiesFilterInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getFilterOptions } = usePrograms()

    const { data, isLoading } = getFilterOptions()
    const universities = data?.universities || []

    // Get initial values from URL
    const initialSelected = useMemo(() => {
        const param = searchParams.get(paramName)
        return param ? param.split(",") : []
    }, [searchParams, paramName])

    const [selected, setSelected] = useState<string[]>(initialSelected)

    const updateUrl = useCallback(
        (values: string[]) => {
            const params = new URLSearchParams(searchParams.toString())

            if (values.length > 0) {
                params.set(paramName, values.join(","))
                params.set("page", "1")
            } else {
                params.delete(paramName)
            }

            const basePath = baseUrl.split("?")[0]
            const query = params.toString()
            const url = query ? `${basePath}?${query}` : basePath

            router.push(url)
        },
        [router, searchParams, paramName, baseUrl]
    )

    const toggleUniversity = (value: string) => {
        let updated: string[]

        if (selected.includes(value)) {
            updated = selected.filter((v) => v !== value)
        } else {
            updated = [...selected, value]
        }

        setSelected(updated)
        updateUrl(updated)
    }

    const clearAll = () => {
        setSelected([])
        updateUrl([])
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    {selected.length > 0
                        ? `${selected.length} selected`
                        : placeholder}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 max-h-80 overflow-y-auto">
                {isLoading && <p className="text-sm">Loading...</p>}

                {!isLoading &&
                    universities.map((university: string) => (
                        <div
                            key={university}
                            className="flex items-center space-x-2 py-1"
                        >
                            <Checkbox
                                checked={selected.includes(university)}
                                onCheckedChange={() =>
                                    toggleUniversity(university)
                                }
                            />
                            <label className="text-sm">{university}</label>
                        </div>
                    ))}

                {selected.length > 0 && (
                    <div className="pt-3 border-t mt-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="w-full"
                        >
                            Clear filters
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}