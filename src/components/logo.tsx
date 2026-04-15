import * as React from "react"
import Image from "next/image"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  const width = Math.round(size * 4.6)

  return (
    <div
      className={className}
      style={{ width, height: size }}
      {...props}
    >
      <Image
        src="/logo-removebg-preview.png"
        alt="LinkForex"
        width={width}
        height={size}
        className="h-full w-full object-contain dark:hidden"
        priority
      />
      <Image
        src="/logo-dark-theme.png"
        alt="LinkForex"
        width={width}
        height={size}
        className="hidden h-full w-full object-contain dark:block"
        priority
      />
    </div>
  )
}
