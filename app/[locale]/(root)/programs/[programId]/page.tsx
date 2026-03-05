import React from 'react'
import ProgramPage from './client';

interface ProgramPageProps {
    params: Promise<{ programId: string }>
}

async function page({ params }: ProgramPageProps) {
    const { programId } = await params;
    if (!programId) {
        return null;
    }
    return (
        <ProgramPage programId={programId} />
    )
}

export default page