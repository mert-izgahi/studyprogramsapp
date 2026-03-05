"use client";

import { cn } from '@/lib/utils';
import { IProgram } from '@/models/Program'
import { useLocale } from 'next-intl'
import React from 'react'
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { getProgramDegree } from '@/constants/degrees';

interface ProgramCardProps {
    program: IProgram
}

function ProgramCard({ program }: ProgramCardProps) {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: program.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
            {/* Logo */}
            <div className="h-24 p-3 flex items-center justify-center border-b">
                {program.universityLogo ? (
                    <img
                        src={`https://partner.unitededucation.com${program.universityLogo}`}
                        alt={program.universityName}
                        className="w-16 h-16 object-contain"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full" />
                )}
            </div>

            {/* Content */}
            <CardContent className="p-4 flex-1 flex flex-col">
                {/* Program Name */}
                <h3 className={cn(
                    "font-semibold text-sm line-clamp-2 mb-1",
                    isRTL ? "text-right" : "text-left"
                )}>
                    {isRTL ? program.alternativeProgramName : program.programName}
                </h3>

                {/* University Name */}
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {program.universityName}
                </p>

                {/* Program Degree — derived from title, localized */}
                <Badge className="w-fit mb-2">
                    {getProgramDegree(program.programName, locale)}
                </Badge>

                {/* Price */}
                <div className="text-sm font-bold text-primary mb-3">
                    {formatPrice(program.tuitionFee)}
                </div>

                {/* Language Badge */}
                {program.language && (
                    <Badge variant="secondary" className="w-fit mb-4 text-xs">
                        {program.language}
                    </Badge>
                )}

                {/* View Details Button */}
                <Link href={`/${locale}/programs/${program._id.toString()}`} className="mt-auto">
                    <Button size="sm" variant="outline" className="w-full cursor-pointer">
                        {isRTL ? 'عرض التفاصيل' : 'View Details'}
                        <Eye className="w-4 h-4 mr-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

export default ProgramCard;