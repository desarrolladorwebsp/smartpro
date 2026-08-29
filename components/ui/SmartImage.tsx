"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  fallbackText?: string;
  containerClassName?: string;
};

export function SmartImage({
  src,
  alt,
  fallbackText,
  containerClassName = "",
  className = "",
  onLoad,
  onError,
  fill,
  ...props
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const wrapperClass = fill
    ? "relative overflow-hidden"
    : "relative block overflow-hidden";

  const imageClassName = `${
    isLoaded ? "opacity-100" : "opacity-0"
  } transition-opacity duration-500 ease-out ${className}`;

  return (
    <div className={`${wrapperClass} ${containerClassName}`.trim()}>
      {!isLoaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.18),_rgba(15,23,42,0.18)_45%,_rgba(15,23,42,0.08))]"
        />
      )}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.15),_rgba(15,23,42,0.08))] px-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {fallbackText ?? alt}
        </div>
      ) : (
        <Image
          {...props}
          src={src}
          alt={alt}
          fill={fill}
          onLoad={(event) => {
            setIsLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            setHasError(true);
            onError?.(event);
          }}
          className={imageClassName}
        />
      )}
    </div>
  );
}
