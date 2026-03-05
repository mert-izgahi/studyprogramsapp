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

import { DEGREE_OPTIONS } from "@/constants/degrees"

export type DegreeId = typeof DEGREE_OPTIONS[number]['id']

interface DegreeFilterInputProps {
    baseUrl: string
    paramName?: string
    label?: string
    placeholder?: string
}

export default function DegreeFilterInput({
    baseUrl,
    paramName = "degrees",
    label,
    placeholder,
}: DegreeFilterInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocale()
    const isAr = locale === "ar"

    const defaultLabel = isAr ? "اختر الدرجة العلمية" : "Select Degree"
    const defaultPlaceholder = isAr ? "اختر الدرجة العلمية" : "Select degrees"

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
            router.push(query ? `${basePath}?${query}` : basePath)
        },
        [router, searchParams, paramName, baseUrl]
    )

    const toggle = (id: string) => {
        const updated = selected.includes(id)
            ? selected.filter((v) => v !== id)
            : [...selected, id]
        setSelected(updated)
        updateUrl(updated)
    }

    const clearAll = () => {
        setSelected([])
        updateUrl([])
    }

    // Build a readable summary of what's selected, e.g. "Bachelor, Master"
    const selectedLabels = useMemo(() => {
        return DEGREE_OPTIONS
            .filter(d => selected.includes(d.id))
            .map(d => isAr ? d.labelAr : d.label)
            .join(", ")
    }, [selected, isAr])

    return (
        <div className="flex flex-col justify-between h-16">
            {(label ?? defaultLabel) && (
                <label className="text-sm font-medium">
                    {label ?? defaultLabel}
                </label>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn("w-full truncate", {
                            "justify-start": !isAr,
                            "justify-end": isAr,
                        })}
                    >
                        <span className="truncate">
                            {selected.length > 0
                                ? selectedLabels
                                : (placeholder ?? defaultPlaceholder)}
                        </span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-56">
                    <div className="flex flex-col gap-1">
                        {DEGREE_OPTIONS.map((degree) => (
                            <div
                                key={degree.id}
                                className="flex items-center space-x-2 py-1.5 px-1 rounded hover:bg-muted cursor-pointer"
                                onClick={() => toggle(degree.id)}
                            >
                                <Checkbox
                                    checked={selected.includes(degree.id)}
                                    onCheckedChange={() => toggle(degree.id)}
                                />
                                <label className="text-sm cursor-pointer select-none">
                                    {isAr ? degree.labelAr : degree.label}
                                </label>
                            </div>
                        ))}

                        {selected.length > 0 && (
                            <div className="pt-3 border-t mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAll}
                                    className="w-full"
                                >
                                    {isAr ? "مسح الفلاتر" : "Clear filters"}
                                </Button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

// Helper to decode degree IDs back to labels (reusable elsewhere)
export function getDegreeLabel(id: string, locale = "en"): string {
    const degree = DEGREE_OPTIONS.find(d => d.id === id)
    if (!degree) return "Unknown"
    return locale === "ar" ? degree.labelAr : degree.label
}