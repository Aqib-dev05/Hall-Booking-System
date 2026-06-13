"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Frown, Loader2 } from "lucide-react";

import VenueCard from "./VenueCard";
import { getVenues, type VenueData, type VenueFilters } from "@/actions/venue.actions";

interface VenueGridProps {
  initialVenues: VenueData[];
}

export default function VenueGrid({ initialVenues }: VenueGridProps) {
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<VenueData[]>(initialVenues);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  // Re-fetch when URL search params change
  useEffect(() => {
    const filters: VenueFilters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      capacityRange: searchParams.get("capacity") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
    };

    // Skip if no filters applied and we have initial data
    const hasFilters = Object.values(filters).some((v) => v !== undefined);
    if (!hasFilters && !hasSearched) return;

    setHasSearched(true);

    startTransition(async () => {
      const result = await getVenues(filters);
      if (result.success) {
        setVenues(result.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Finding venues...
        </p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Frown className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold">No venues found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filters to find the perfect venue for
            your event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {venues.map((venue) => (
        <VenueCard key={venue._id} venue={venue} />
      ))}
    </div>
  );
}
