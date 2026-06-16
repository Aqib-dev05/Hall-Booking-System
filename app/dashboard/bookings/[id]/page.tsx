import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays, Clock, Users, MapPin, DollarSign,
  ArrowLeft, CheckCircle, XCircle, Star,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getBookingById } from "@/actions/booking.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CancelBookingButton from "@/components/dashboard/CancelBookingButton";

const statusConfig: Record<string, { className: string; icon: any }> = {
  pending: { className: "border-amber-500/30 text-amber-500 bg-amber-500/10", icon: Clock },
  confirmed: { className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10", icon: CheckCircle },
  cancelled: { className: "border-red-500/30 text-red-500 bg-red-500/10", icon: XCircle },
  completed: { className: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10", icon: CheckCircle },
};

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await getBookingById(params.id);

  if (!result.success || !result.booking) {
    notFound();
  }

  const booking = result.booking;
  const venue = booking.venue;
  const eventDate = new Date(booking.eventDate);
  const now = new Date();
  const isPast = eventDate < now;
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = booking.status !== "cancelled" && booking.status !== "completed" && hoursUntilEvent >= 48;
  const canReview = isPast && (booking.status === "completed" || (booking.status === "confirmed" && isPast));

  const StatusIcon = statusConfig[booking.status]?.icon || Clock;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/bookings" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{venue?.name || "Booking Details"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Booking ID: <span className="font-mono">{booking._id}</span>
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm px-3 py-1 ${statusConfig[booking.status]?.className || ""}`}
        >
          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Slot</p>
                    <p className="font-medium">{booking.startTime} – {booking.endTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Guest Count</p>
                    <p className="font-medium">{booking.guestCount} People</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium text-lg">${booking.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {booking.eventType && (
                <>
                  <Separator className="bg-border/50" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event Type</p>
                    <p className="font-medium">{booking.eventType}</p>
                  </div>
                </>
              )}

              {booking.specialRequests && (
                <>
                  <Separator className="bg-border/50" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Requests</p>
                    <p className="text-sm">{booking.specialRequests}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge
                  variant="outline"
                  className={
                    booking.paymentStatus === "paid"
                      ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                      : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                  }
                >
                  {booking.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-bold text-xl">${booking.totalAmount?.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Venue Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
            {venue?.images?.[0] && (
              <div className="w-full aspect-video bg-muted relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-lg">{venue?.name}</h3>
              {venue?.location && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {venue.location}, {venue.city}
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/venues/${venue?._id}`}>View Venue</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardContent className="p-4 space-y-3">
              {canCancel && (
                <CancelBookingButton bookingId={booking._id} venueName={venue?.name || "this venue"} />
              )}
              {canReview && (
                <Button variant="outline" className="w-full gap-2">
                  <Star className="h-4 w-4" /> Leave a Review
                </Button>
              )}
              {booking.status === "cancelled" && (
                <p className="text-sm text-muted-foreground text-center">
                  This booking has been cancelled. Refund will be processed in 5–7 business days.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
