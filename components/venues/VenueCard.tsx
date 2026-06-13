"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Users, MapPin, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VenueData } from "@/actions/venue.actions";

const categoryColors: Record<string, string> = {
  wedding: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  party: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  corporate: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  birthday: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  concert: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  other: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

interface VenueCardProps {
  venue: VenueData;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const categoryStyle = categoryColors[venue.category] || categoryColors.other;

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {venue.images && venue.images.length > 0 ? (
          <Image
            src={venue.images[0]}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`${categoryStyle} border backdrop-blur-md text-xs font-medium capitalize`}
          >
            {venue.category}
          </Badge>
        </div>

        {/* Rating badge */}
        {venue.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/40 backdrop-blur-md px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-white">
              {venue.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Name and Location */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {venue.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{venue.city}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Up to <span className="font-medium text-foreground">{venue.capacity}</span> guests</span>
          </div>
          {venue.totalReviews > 0 && (
            <span className="text-xs text-muted-foreground">
              {venue.totalReviews} review{venue.totalReviews !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">
                ${venue.pricePerHour.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                /hr
              </span>
            </div>
          </div>
          <Button asChild size="sm" className="shadow-lg shadow-primary/20">
            <Link href={`/venues/${venue._id}`}>
              Book Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
