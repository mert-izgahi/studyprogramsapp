"use client"
import { Link } from '@/i18n/routing'
import Image from 'next/image'

function Logo() {
  return (
    <Link href={'/'} className='flex items-center gap-1'>
        <Image src={"/logo.svg"} width={40} height={40} alt='joody' className='inline'/>
        <span className='hidden md:inline font-bold text-sm'>JoodyStudy</span>
    </Link>
  )
}

export default Logo