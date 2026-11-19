"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  className?: string;
  textClassName?: string;
}

function isUsableImageUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^(https?:\/\/|\/)/i.test(value);
}

export function UserAvatar({
  name,
  image,
  className,
  textClassName,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // A profile update can replace the URL; give the new image a fresh chance.
    setFailed(false);
  }, [image]);

  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  const showImage = isUsableImageUrl(image) && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-red font-bold text-white",
        className,
      )}
    >
      {showImage ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true" className={textClassName}>
          {initials}
        </span>
      )}
    </span>
  );
}
