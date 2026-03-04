"use client";


import MultiFilterInput from '@/components/fields/multi-filter-field';
import { PriceFilterField } from '@/components/fields/price-filter-field';
import TermsFilterInput from '@/components/fields/terms-filter-input';
import UniversitiesFilterInput from '@/components/fields/universities-filter-input';
import Container from '@/components/shared/container'
import { Pagination } from '@/components/shared/pagination';
import SearchForm from '@/components/shared/search-form';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrograms } from '@/hooks/use-programs';
import { IProgram } from '@/models/Program';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react'

function ProgramsPage() {

    const { getPrograms, getFilterOptions } = usePrograms();
    const { data: filterOptions } = getFilterOptions();

    const universities = useMemo(() => {
        return filterOptions?.universities || []
    }, [filterOptions]);
    const languages = useMemo(() => {
        return filterOptions?.languages || []
    }, [filterOptions]);
    const campuses = useMemo(() => {
        return filterOptions?.campuses || []
    }, [filterOptions]);
    const locale = useLocale();
    const searchParams = useSearchParams();

    const minPrice = Number(searchParams.get('price_min')) || undefined;

    const maxPrice = Number(searchParams.get('price_max')) || undefined;

    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = 12;


    const { data, isLoading } = getPrograms(
        {
            search: searchParams.get('search') || undefined,
            termId: searchParams.get('termId') || undefined,
            universities: searchParams.get('universities') || undefined,
            languages: searchParams.get('languages') || undefined,
            campuses: searchParams.get('campuses') || undefined,
            minPrice,
            maxPrice,
            quotaFull: searchParams.get('quotaFull') === 'true'
        },
        {
            page: currentPage,
            limit: pageSize
        }
    );

    const title = useMemo(() => {
        switch (locale) {
            case 'en':
                return "Study Programs List"
            case 'ar':
                return "قائمة البرامج الدراسية"
            default:
                return 'Programs'
        }
    }, [locale]);

    const desc = useMemo(() => {
        switch (locale) {
            case 'en':
                return "Search for programs and universities Manage your lists and get notified when new programs are available"
            case 'ar':
                return "ابحث عن برامج وجامعات إدارة قوائمك وأحصل على إشعارات عندما يتوفر برامج جديدة"
            default:
                return "Search for programs and universities Manage your lists and get notified when new programs are available"
        }
    }, [locale]);

    return (
        <Container className='py-8 flex flex-col gap-8'>
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>

            <SearchForm baseUrl={`/${locale}/programs`} placeholder={locale === 'en' ? "Search for programs" : "ابحث عن برامج"} buttonText={locale === 'en' ? "Search" : "ابحث"}
                locale={locale} />

            <TermsFilterInput />

            <MultiFilterInput
                baseUrl={`/${locale}/programs`}
                paramName="universities"
                options={universities || []}
                placeholder={locale === 'en' ? "Select universities" : "اختر الجامعات"}
            />

            <MultiFilterInput
                baseUrl={`/${locale}/programs`}
                paramName="languages"
                options={languages || []}
                placeholder={locale === 'en' ? "Select languages" : "اختر اللغات"}
            />

            <MultiFilterInput
                baseUrl={`/${locale}/programs`}
                paramName="campuses"
                options={campuses || []}
                placeholder={locale === 'en' ? "Select campuses" : "اختر الكمبوس"}
            />

            <PriceFilterField
                baseUrl={`/${locale}/programs`}
                paramName="price"
                label={locale === 'en' ? "Price" : "السعر"}
                minPrice={0}
                maxPrice={10000}
            />
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {new Array(8).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-32 w-full" />
                    ))}
                </div>
            )}


            {data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {data.rows.map((program: IProgram) => (

                            <div
                                key={program._id.toString()}
                                className="p-4 border rounded-lg"
                            >
                                <h2 className="font-semibold">
                                    {program.programName}
                                </h2>

                            </div>

                        ))}

                    </div>


                    {/* Pagination */}
                    <div className="flex justify-between items-center">

                        <p className="text-sm text-muted-foreground">
                            Showing {(data.pagination.currentPage - 1) * pageSize + 1}
                            -
                            {Math.min(
                                data.pagination.currentPage * pageSize,
                                data.pagination.totalRecords
                            )}
                            of {data.pagination.totalRecords}
                        </p>


                        <Pagination
                            currentPage={data.pagination.currentPage}
                            totalPages={data.pagination.totalPages}
                            baseUrl={`/programs?locale=${locale}`}
                            recordsPerPage={data.pagination.recordsPerPage}
                            totalRecords={data.pagination.totalRecords}
                            hasNextPage={data.pagination.hasNextPage}
                            hasPreviousPage={data.pagination.hasPreviousPage}
                        />

                    </div>


                </>
            )}


        </Container>
    )
}

export default ProgramsPage