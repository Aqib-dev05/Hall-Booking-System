"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CheckCircle2, ChevronRight, Loader2, CalendarIcon, Users, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createBooking, checkVenueAvailability } from "@/actions/booking.actions";
import type { VenueData } from "@/actions/venue.actions";

// Initialize Stripe (publishable key should be in env)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface BookingWizardProps {
  venue: VenueData;
  initialData: {
    date?: string;
    startTime?: string;
    endTime?: string;
    guests?: string;
    eventType?: string;
  };
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

import StripePaymentForm from "./StripePaymentForm";

export default function BookingWizard({ venue, initialData }: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [date, setDate] = useState<Date | undefined>(initialData.date ? new Date(initialData.date) : undefined);
  const [startTime, setStartTime] = useState(initialData.startTime || "");
  const [endTime, setEndTime] = useState(initialData.endTime || "");
  const [guests, setGuests] = useState(initialData.guests || "1");
  const [eventType, setEventType] = useState(initialData.eventType || "");
  const [specialRequests, setSpecialRequests] = useState("");

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Derived values
  let hoursDuration = 0;
  if (startTime && endTime) {
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    if (endHour > startHour) {
      hoursDuration = endHour - startHour;
    }
  }

  const subtotal = hoursDuration * venue.pricePerHour;
  const serviceFee = Math.round(subtotal * 0.1); // 10% fee
  const totalAmount = subtotal + serviceFee;

  const isStep1Valid = date && startTime && endTime && hoursDuration > 0 && guests && parseInt(guests) <= venue.capacity && eventType;

  // Handlers
  const handleNextToReview = async () => {
    if (!isStep1Valid) return;
    
    setIsLoading(true);
    // Verify availability
    const result = await checkVenueAvailability(venue._id, date.toISOString(), startTime, endTime);
    setIsLoading(false);
    
    if (!result.available) {
      toast.error("Not Available", { description: result.error || "This time slot is already booked." });
      return;
    }
    
    setStep(2);
  };

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    
    // 1. Create pending booking record
    const bookingResult = await createBooking({
      venueId: venue._id,
      eventType,
      eventDate: date!.toISOString(),
      startTime,
      endTime,
      guestCount: parseInt(guests),
      totalAmount,
      specialRequests,
    });
    
    if (!bookingResult.success || !bookingResult.bookingId) {
      setIsLoading(false);
      toast.error("Booking Error", { description: bookingResult.error || "Failed to initialize booking." });
      return;
    }

    setBookingId(bookingResult.bookingId);

    // 2. Fetch PaymentIntent
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          bookingId: bookingResult.bookingId,
          venueId: venue._id,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Payment initialization failed");
      }

      setClientSecret(data.clientSecret);
      setStep(3);
    } catch (err: any) {
      toast.error("Payment Initialization Failed", { description: err.message || "Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content (Wizard) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, title: "Event Details" },
            { num: 2, title: "Review" },
            { num: 3, title: "Payment" },
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center flex-1 relative">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-colors",
                step === s.num ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
                step > s.num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
              </div>
              <span className="text-xs font-medium mt-2 text-center">{s.title}</span>
              {i < 2 && (
                <div className={cn(
                  "absolute top-5 left-1/2 w-full h-[2px] -translate-y-1/2",
                  step > s.num ? "bg-primary/50" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Event Details */}
        {step === 1 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Configure your booking details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Event Type / Name</Label>
                <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. 30th Birthday Party" className="bg-background/50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background/50", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Guest Count</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min="1" max={venue.capacity} value={guests} onChange={(e) => setGuests(e.target.value)} className="pl-9 bg-background/50" />
                  </div>
                  {parseInt(guests) > venue.capacity && <p className="text-xs text-destructive">Max capacity is {venue.capacity}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Start" /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="End" /></SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => {
                        if (startTime && parseInt(hour) <= parseInt(startTime)) return null;
                        return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Requests (Optional)</Label>
                <Textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Any specific requirements?" className="bg-background/50 min-h-[100px]" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <Button onClick={handleNextToReview} disabled={!isStep1Valid || isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Review Booking"}
                {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Please verify your booking details before proceeding to payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="font-medium">{eventType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{date && format(date, "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{startTime} - {endTime} ({hoursDuration} hrs)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-medium">{guests}</p>
                </div>
                {specialRequests && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Special Requests</p>
                    <p className="text-sm">{specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-lg">Price Breakdown</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">${venue.pricePerHour} × {hoursDuration} hours</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee (10%)</span>
                  <span>${serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-border/50">
                  <span>Total Amount</span>
                  <span className="text-primary">${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>Back</Button>
              <Button onClick={handleProceedToPayment} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Pay"}
                {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 3 && clientSecret && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Secure Payment</CardTitle>
              <CardDescription>Complete your booking with a secure card payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                <StripePaymentForm 
                  clientSecret={clientSecret} 
                  totalAmount={totalAmount}
                  bookingId={bookingId!}
                  onBack={() => setStep(2)}
                />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Venue Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24 border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
          {venue.images && venue.images[0] && (
            <div className="w-full aspect-video bg-muted relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{venue.name}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" /> {venue.city}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Max {venue.capacity}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> ${venue.pricePerHour}/hr</span>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
