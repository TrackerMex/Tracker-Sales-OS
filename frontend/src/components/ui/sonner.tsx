"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          fontFamily: 'inherit',
          fontSize: '13px',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
