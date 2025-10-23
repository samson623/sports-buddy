"use client"

import Image, { ImageProps } from "next/image"

type SmartImageProps = Omit<ImageProps, "loader"> & {
  sizes?: string
}

// Wrapper around next/image that keeps lazy loading and responsive sizes,
// while not requiring remotePatterns (unoptimized=true for now).
export default function SmartImage({ sizes = "(max-width: 640px) 64px, 128px", alt, ...props }: SmartImageProps) {
  return (
    <Image
      alt={alt}
      sizes={sizes}
      loading="lazy"
      unoptimized
      {...props}
    />
  )
}
