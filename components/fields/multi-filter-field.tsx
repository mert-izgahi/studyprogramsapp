"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"

interface MultiFilterInputProps {
    placeholder?: string
    baseUrl: string
    paramName: string
    options: string[]
    label?: string
}

export default function MultiFilterInput({
    placeholder = "Select values",
    baseUrl,
    paramName,
    options,
    label
}: MultiFilterInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
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

    const toggle = (value: string) => {
        let updated: string[]

        if (selected.includes(value)) {
            updated = selected.filter((v) => v !== value)
        } else {
            updated = [...selected, value]
        }

        setSelected(updated)
        updateUrl(updated)
    }
    const locale = useLocale()
    const clearAll = () => {
        setSelected([])
        updateUrl([])
    }

    return (
        <div className="flex flex-col justify-between h-16">
            {label && <label className="text-sm font-medium">{label}</label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full ", {
                        "justify-start": locale === "en",
                        "justify-end": locale === "ar"
                    })}>
                        {selected.length > 0
                            ? `${selected.length} selected`
                            : placeholder}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-64 max-h-80 overflow-y-auto">
                    {
                        options.map((program: string) => (
                            <div
                                key={program}
                                className="flex items-center space-x-2 py-1"
                            >
                                <Checkbox
                                    checked={selected.includes(program)}
                                    onCheckedChange={() =>
                                        toggle(program)
                                    }
                                />
                                <label className="text-sm">{program}</label>
                            </div>
                        ))
                    }

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
        </div>
    )
}