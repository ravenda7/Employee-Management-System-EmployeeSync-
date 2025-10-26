'use client';

import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginatedData {
    total: number; 
}

interface DataPaginationProps {
    data: PaginatedData | null | undefined;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    pageSize?: number;
}

/**
 * Reusable component for displaying and controlling pagination for data sets.
 * * @param data - Object containing the total number of items { total: number }.
 * @param page - The current active page number (1-based index).
 * @param setPage - State setter function to change the current page.
 * @param pageSize - Number of items per page. Defaults to 10.
 */
export const DataPagination: React.FC<DataPaginationProps> = ({
    data,
    page,
    setPage,
    pageSize = 6,
}) => {
    if (!data || data.total === 0) {
        return null;
    }

    const totalPages = Math.ceil(data.total / pageSize);

    React.useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [page, totalPages, setPage]);

    if (totalPages <= 1) {
        return null;
    }

    // Function to handle moving to the previous page
    const goToPreviousPage = () => {
        setPage((prev) => Math.max(1, prev - 1));
    };

    // Function to handle moving to the next page
    const goToNextPage = () => {
        setPage((prev) => Math.min(totalPages, prev + 1));
    };

    return (
        <Pagination>
            <PaginationContent className="flex justify-end w-full">
                {/* Previous Button */}
                <PaginationItem>
                    <PaginationPrevious
                        onClick={goToPreviousPage}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                {/* Page Number Links */}
                {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i + 1}>
                        <PaginationLink
                            isActive={i + 1 === page}
                            onClick={() => setPage(i + 1)}
                            className="cursor-pointer"
                        >
                            {i + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                {/* Next Button */}
                <PaginationItem>
                    <PaginationNext
                        onClick={goToNextPage}
                        className={
                            page >= totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
