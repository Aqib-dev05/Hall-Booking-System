"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInHours } from "date-fns";
import { CalendarIcon, Users, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookingWidgetProps {
  venueId: string;
  pricePerHour: number;
  maxCapacity: number;
  isLoggedIn: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

export default function BookingWidget({ venueId, pricePerHour, maxCapacity, isLoggedIn }: BookingWidgetProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [guests, setGuests] = useState<string>("1");
  const [eventType, setEventType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total price
  let totalAmount = 0;
  let hoursDuration = 0;
  
  if (startTime && endTime) {
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    
    if (endHour > startHour) {
      hoursDuration = endHour - startHour;
      totalAmount = hoursDuration * pricePerHour;
    }
  }

  const handleBook = () => {
    if (!isLoggedIn) {
      // Redirect to login and specify callbackUrl to come back to booking page
      const callbackUrl = encodeURIComponent(`/booking/${venueId}`);
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    setIsLoading(true);
    // Build query params to pass to the booking form
    const params = new URLSearchParams({
      date: date ? date.toISOString() : "",
      startTime,
      endTime,
      guests,
      eventType,
      total: totalAmount.toString(),
    });

    router.push(`/booking/${venueId}?${params.toString()}`);
  };

  const isFormValid = date && startTime && endTime && hoursDuration > 0 && guests && eventType;

  return (
    <Card className="sticky top-24 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-amber-400" />
      
      <CardHeader className="pb-4">
        <CardTitle className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary">${pricePerHour.toLocaleString()}</span>
          <span className="text-sm font-medium text-muted-foreground">/ hour</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 h-11",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}

                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Start Time</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="h-11 bg-background/50">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((hour) => (
                  <SelectItem key={`start-${hour}`} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">End Time</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="h-11 bg-background/50">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((hour) => {
                  // Only show end times after start time if start time is selected
                  if (startTime && parseInt(hour) <= parseInt(startTime)) return null;
                  return (
                    <SelectItem key={`end-${hour}`} value={hour}>
                      {hour}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Guest Count */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Guests</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number" 
              min="1" 
              max={maxCapacity} 
              value={guests} 
              onChange={(e) => setGuests(e.target.value)}
              className="pl-9 h-11 bg-background/50"
              placeholder={`Max ${maxCapacity}`}
            />
          </div>
          {parseInt(guests) > maxCapacity && (
            <p className="text-xs text-destructive">Maximum capacity is {maxCapacity}</p>
          )}
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Event Type</Label>
          <Input 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            className="h-11 bg-background/50"
            placeholder="e.g. Wedding Reception, Corporate Retreat"
          />
        </div>

        {/* Total Calculation */}
        {hoursDuration > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${pricePerHour} x {hoursDuration} hours</span>
              <span>${totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20" 
          size="lg"
          disabled={!isFormValid || parseInt(guests) > maxCapacity || isLoading}
          onClick={handleBook}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
          ) : (
            isLoggedIn ? "Proceed to Book" : "Sign in to Book"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
