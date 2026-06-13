import { Suspense } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import FilterBar from "@/components/venues/FilterBar";
import VenueGrid from "@/components/venues/VenueGrid";
import { getVenues } from "@/actions/venue.actions";

export const metadata: Metadata = {
  title: "Browse Venues | Elysian Fields",
  description:
    "Discover and book the perfect venue for your wedding, party, corporate event, or celebration. Browse our curated collection of premium venues.",
};

export default async function VenuesPage() {
  // Initial server-side fetch (no filters)
  const result = await getVenues();
  const initialVenues = result.success ? result.data : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary uppercase tracking-wider">
            Explore
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Find Your Perfect Venue
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Browse our handpicked collection of stunning venues for weddings,
          parties, corporate events, and more. Use the filters to narrow down
          your search.
        </p>
      </div>

      {/* Filter Bar */}
      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {initialVenues.length}
        </span>
        <span>venue{initialVenues.length !== 1 ? "s" : ""} available</span>
      </div>

      {/* Venue Grid */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading venues...</p>
          </div>
        }
      >
        <VenueGrid initialVenues={initialVenues} />
      </Suspense>
    </div>
  );
}
