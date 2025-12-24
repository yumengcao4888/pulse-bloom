"use client";

import Image from "next/image";
import { useState } from "react";

type HealerProfileImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
};

export default function HealerProfileImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/default-healer.jpg",
}: HealerProfileImageProps) {
  const [imageSrc, setImageSrc] = useState(src);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
      }}
    />
  );
}
