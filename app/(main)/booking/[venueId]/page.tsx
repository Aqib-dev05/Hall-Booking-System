import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getVenueById } from "@/actions/venue.actions";
import BookingWizard from "@/components/booking/BookingWizard";
import { Button } from "@/components/ui/button";

interface BookingPageProps {
  params: {
    venueId: string;
  };
  searchParams: {
    date?: string;
    startTime?: string;
    endTime?: string;
    guests?: string;
    eventType?: string;
  };
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const result = await getVenueById(params.venueId);
  return {
    title: `Book ${result.data?.name || "Venue"} | Elysian Fields`,
  };
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    // If somehow landed here unauthenticated
    const callbackUrl = encodeURIComponent(`/booking/${params.venueId}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  const result = await getVenueById(params.venueId);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const venue = result.data;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="pl-0 text-muted-foreground hover:text-foreground">
          <Link href={`/venues/${venue._id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Venue
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Booking</h1>
        </div>
      </div>

      <BookingWizard 
        venue={venue} 
        initialData={{
          date: searchParams.date,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          guests: searchParams.guests,
          eventType: searchParams.eventType,
        }}
      />
    </div>
  );
}
