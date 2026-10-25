import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(!src);

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium uppercase text-muted-foreground",
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || "Avatar"}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
