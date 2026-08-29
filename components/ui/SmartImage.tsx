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

  // Si el contenedor ya trae su propio posicionamiento (p.ej. "absolute inset-0"),
  // no forzamos "relative": ambas clases fijan `position` y, en Tailwind v4,
  // "relative" gana en cascada sobre "absolute", dejando el contenedor sin altura.
  const hasExplicitPosition = /\b(absolute|fixed|sticky|static)\b/.test(
    containerClassName,
  );
  const wrapperClass = hasExplicitPosition
    ? "overflow-hidden"
    : fill
      ? "relative overflow-hidden"
      : "relative block overflow-hidden";

  const imageClassName = `${
    isLoaded ? "opacity-100" : "opacity-0"
  } transition-opacity duration-500 ease-out ${className}`;

  return (
    <div className={`${wrapperClass} ${containerClassName}`.trim()}>
      {!isLoaded && !hasError && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.18),_rgba(15,23,42,0.18)_45%,_rgba(15,23,42,0.08))]"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/10 backdrop-blur-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
            </div>
          </div>
        </>
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
          loading={props.priority ? undefined : props.loading ?? "lazy"}
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
