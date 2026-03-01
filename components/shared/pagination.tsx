import {
    Pagination as PaginationCN,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { PaginationInfo } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface PaginationProps extends PaginationInfo {
    baseUrl?: string;
}

type PageItem = number | "ellipsis";

export function Pagination({
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    baseUrl = "",
}: PaginationProps) {
    console.log({currentPage, totalPages});
    
    const router = useRouter();
    const searchParams = useSearchParams();

    const createPageURL = useCallback(
        (pageNumber: number) => {
            // Create a new URLSearchParams from the current searchParams
            const params = new URLSearchParams(searchParams.toString());
            
            // Set the page parameter
            params.set("page", pageNumber.toString());

            // Remove any existing pathname from baseUrl if it contains query params
            // This ensures we're not duplicating query strings
            const basePath = baseUrl.split('?')[0];
            
            return `${basePath}?${params.toString()}`;
        },
        [searchParams, baseUrl]
    );

    const handlePageChange = useCallback(
        (pageNumber: number) => {
            if (pageNumber < 1 || pageNumber > totalPages)
                return;

            router.push(createPageURL(pageNumber));
        },
        [router, createPageURL, totalPages]
    );

    const pageItems = useMemo<PageItem[]>(() => {
        const delta = 2;
        const range: number[] = [];
        const result: PageItem[] = [];

        let lastPage: number | undefined;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta &&
                    i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        range.forEach((page) => {
            if (lastPage !== undefined) {
                if (page - lastPage === 2) {
                    result.push(lastPage + 1);
                } else if (page - lastPage > 2) {
                    result.push("ellipsis");
                }
            }

            result.push(page);
            lastPage = page;
        });

        return result;
    }, [currentPage, totalPages]);

    if (totalPages <= 1)
        return null;

    return (
        <PaginationCN>
            <PaginationContent>
                {/* Previous */}
                <PaginationItem>
                    <PaginationPrevious
                        href={createPageURL(currentPage - 1)}
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                        }}
                        aria-disabled={!hasPreviousPage}
                        className={
                            !hasPreviousPage
                                ? "pointer-events-none opacity-50"
                                : ""
                        }
                    />
                </PaginationItem>

                {/* Pages */}
                {pageItems.map((item,index) => (
                    <PaginationItem key={`${item}-${index}`}>
                        {item === "ellipsis" ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                href={createPageURL(item)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(item);
                                }}
                                isActive={currentPage === item}
                            >
                                {item}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                {/* Next */}
                <PaginationItem>
                    <PaginationNext
                        href={createPageURL(currentPage + 1)}
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                        }}
                        aria-disabled={!hasNextPage}
                        className={
                            !hasNextPage
                                ? "pointer-events-none opacity-50"
                                : ""
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </PaginationCN>
    );
}