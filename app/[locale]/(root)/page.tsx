"use client";
import RootHeader from '@/components/layouts/root-header'
import { useSession } from 'next-auth/react';
import React from 'react'

function Page() {
  const { data, status } = useSession();
  return (
    <div className='w-full flex flex-col'>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export default Page