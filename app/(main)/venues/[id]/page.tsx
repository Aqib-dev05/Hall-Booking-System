import { notFound } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { MapPin, Users, Star, CheckCircle2, ShieldCheck } from "lucide-react";

import { getVenueById, getVenueReviews } from "@/actions/venue.actions";
import ImageGallery from "@/components/venues/ImageGallery";
import BookingWidget from "@/components/venues/BookingWidget";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface VenuePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const result = await getVenueById(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: "Venue Not Found | Elysian Fields",
    };
  }

  return {
    title: `${result.data.name} | Elysian Fields`,
    description: result.data.description,
  };
}

export default async function VenueDetailPage({ params }: VenuePageProps) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const [venueResult, reviewsResult] = await Promise.all([
    getVenueById(params.id),
    getVenueReviews(params.id),
  ]);

  if (!venueResult.success || !venueResult.data) {
    notFound();
  }

  const venue = venueResult.data;
  const reviews = reviewsResult.success ? reviewsResult.data : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Header and Image Gallery */}
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors uppercase tracking-wider text-[10px] font-bold">
                {venue.category}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                <MapPin className="h-4 w-4" />
                {venue.city}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{venue.name}</h1>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-base">{venue.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({venue.totalReviews} reviews)</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5 text-foreground">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>Up to {venue.capacity} guests</span>
              </div>
            </div>
          </div>
        </div>

        <ImageGallery images={venue.images} name={venue.name} />
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">About this venue</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {venue.description}
            </p>
          </section>

          <Separator className="bg-border/50" />

          {/* Amenities */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">What this place offers</h2>
            {venue.amenities && venue.amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {venue.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-foreground/80">{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No amenities listed.</p>
            )}
          </section>

          <Separator className="bg-border/50" />

          {/* Location / Map Placeholder */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Location</h2>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {venue.location}, {venue.city}
              </p>
            </div>
            
            <div className="w-full aspect-[21/9] bg-muted/50 rounded-2xl border border-border/50 overflow-hidden relative group">
              {/* Google Maps embed placeholder */}
              <div className="absolute inset-0 bg-background/20 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-background/10">
                <MapPin className="h-10 w-10 text-primary mb-2" />
                <p className="font-medium text-sm">Interactive Map View</p>
                <p className="text-xs text-muted-foreground">Coordinates mapped to {venue.city}</p>
              </div>
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* Reviews Section */}
          <section className="space-y-8" id="reviews">
            <div className="flex items-baseline gap-4">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                {venue.rating.toFixed(1)} 
              </h2>
              <span className="text-xl text-muted-foreground font-medium">
                · {venue.totalReviews} Review{venue.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review._id} className="space-y-3 p-5 rounded-2xl bg-card/40 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < review.rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl bg-muted/30 border border-border/50 border-dashed">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium text-lg">No reviews yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                  Be the first to experience this wonderful venue and leave a review.
                </p>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1 relative">
          <BookingWidget 
            venueId={venue._id}
            pricePerHour={venue.pricePerHour}
            maxCapacity={venue.capacity}
            isLoggedIn={isLoggedIn}
          />
        </div>

      </div>
    </div>
  );
}
