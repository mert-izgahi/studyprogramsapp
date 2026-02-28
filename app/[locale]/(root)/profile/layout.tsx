import React, { PropsWithChildren } from 'react'

function layout({ children }: PropsWithChildren) {
    return (
        <div>{children}</div>
    )
}

export default layout