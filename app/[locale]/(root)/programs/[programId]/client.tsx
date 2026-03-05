"use client"
import React from 'react'


interface ProgramPageProps {
    programId: string
}

function ProgramPage({programId}: ProgramPageProps) {
  return (
    <div>ProgramPage - {programId}</div>
  )
}

export default ProgramPage