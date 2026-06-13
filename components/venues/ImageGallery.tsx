"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export default function ImageGallery({ images, name }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[21/9] rounded-2xl bg-muted flex items-center justify-center border border-border/50 overflow-hidden">
        <div className="text-center space-y-2 text-muted-foreground/50">
          <ImageIcon className="h-12 w-12 mx-auto opacity-50" />
          <p>No images available for this venue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-muted border border-border/50 group">
        <Image
          src={images[activeIndex]}
          alt={`${name} - View ${activeIndex + 1}`}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-24 sm:w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300",
                activeIndex === index
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
              )}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
