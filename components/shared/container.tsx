import React, { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends PropsWithChildren {
    className?: string
}
function Container({ className,children }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}

export default Container