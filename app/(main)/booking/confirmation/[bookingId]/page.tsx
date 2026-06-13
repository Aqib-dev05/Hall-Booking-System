import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, Printer, Calendar, Clock, MapPin, Users } from "lucide-react";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import PrintButton from "@/components/booking/PrintButton";

export default async function BookingConfirmationPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();
  
  // Populate the venue to show its details
  const booking = await Booking.findById(params.bookingId).populate("venue").lean() as any;

  if (!booking) {
    notFound();
  }

  // Ensure the user actually owns this booking
  if (String(booking.user) !== session.user.id) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Unauthorized</h1>
        <p className="text-muted-foreground">You do not have permission to view this booking.</p>
        <Button asChild className="mt-8">
          <Link href="/dashboard/bookings">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Booking Confirmed!</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Thank you for your payment. Your booking at <span className="font-semibold text-foreground">{booking.venue.name}</span> is confirmed and ready.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden print:shadow-none print:border-border">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 print:hidden" />
        
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Booking Summary</CardTitle>
              <CardDescription>Booking ID: {booking._id.toString()}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 capitalize">
                {booking.status}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(booking.eventDate), "EEEE, MMMM do, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Guests</p>
                    <p className="font-medium">{booking.guestCount} People</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Venue Details</h3>
              <div className="space-y-3">
                <p className="font-medium text-lg">{booking.venue.name}</p>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{booking.venue.location}, {booking.venue.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6">
            <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-4">Payment Information</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Total Amount Paid</span>
              <span className="font-bold text-xl">${booking.totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Payment Status: <span className="text-foreground capitalize">{booking.paymentStatus}</span>
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <PrintButton />
        <Button size="lg" asChild>
          <Link href="/dashboard/bookings">View My Bookings</Link>
        </Button>
      </div>

    </div>
  );
}
