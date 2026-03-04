import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";

interface PriceFilterFieldProps {
    placeholder?: string
    label?: string
    baseUrl: string
    paramName: string
    minPrice: number
    maxPrice: number
}

export function PriceFilterField({ placeholder, label, baseUrl, paramName, minPrice, maxPrice }: PriceFilterFieldProps) {
    const [min, setMin] = useState<number | string>(minPrice);
    const [max, setMax] = useState<number | string>(maxPrice);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize values from URL params on mount
    useEffect(() => {
        const minParam = searchParams.get(`${paramName}_min`);
        const maxParam = searchParams.get(`${paramName}_max`);

        if (minParam) setMin(minParam);
        if (maxParam) setMax(maxParam);
    }, [searchParams, paramName]);

    const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMin(value);
    }, []);

    const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMax(value);
    }, []);

    const applyPriceFilter = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Handle min price
        const minValue = parseInt(min as string);
        if (!isNaN(minValue) && minValue >= 0) {
            params.set(`${paramName}_min`, minValue.toString());
        } else {
            params.delete(`${paramName}_min`);
        }

        // Handle max price
        const maxValue = parseInt(max as string);
        if (!isNaN(maxValue) && maxValue >= 0) {
            params.set(`${paramName}_max`, maxValue.toString());
        } else {
            params.delete(`${paramName}_max`);
        }

        // Reset to first page
        params.set("page", "1");

        const query = params.toString();
        const url = query ? `${baseUrl}?${query}` : baseUrl;

        router.push(url);
    }, [router, searchParams, paramName, baseUrl, min, max]);

    // Debounced filter application (optional)
    useEffect(() => {
        const timer = setTimeout(() => {
            applyPriceFilter();
        }, 500);

        return () => clearTimeout(timer);
    }, [min, max, applyPriceFilter]);

    return (
        <div className="space-y-2">
            {label && <p className="text-sm font-semibold">{label}</p>}
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    placeholder="Min"
                    value={min}
                    onChange={handleMinChange}
                    min={0}
                    max={typeof max === 'number' ? max : undefined}
                    className="w-full"
                />
                <span className="text-gray-500">-</span>
                <Input
                    type="number"
                    placeholder="Max"
                    value={max}
                    onChange={handleMaxChange}
                    min={typeof min === 'number' ? min : 0}
                    className="w-full"
                />
            </div>
            {placeholder && (
                <p className="text-sm text-gray-500">{placeholder}</p>
            )}
        </div>
    );
}