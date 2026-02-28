import React, { PropsWithChildren } from 'react'

async function layout({ children }: PropsWithChildren) {

    return (
        <>{children}</>
    )
}

export default layout