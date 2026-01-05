"use client";

import Image from "next/image";
import { useState } from "react";

type ProfileImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
};

export default function ProfileImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/default-healer.jpg",
}: ProfileImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
