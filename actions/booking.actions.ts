"use server";

import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

// Initialize Stripe (ensure STRIPE_SECRET_KEY is in .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia", // Matching the installed SDK version
});

export async function checkVenueAvailability(
  venueId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; error?: string }> {
  try {
    await dbConnect();
    
    // Convert incoming date string to UTC start of day for comparison
    const eventDate = new Date(date);
    eventDate.setUTCHours(0, 0, 0, 0);

    // Basic overlap checking logic for bookings on the same day
    const overlappingBookings = await Booking.find({
      venue: venueId,
      eventDate: eventDate,
      status: { $in: ["confirmed", "completed"] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (overlappingBookings.length > 0) {
      return { available: false };
    }

    return { available: true };
  } catch (error) {
    console.error("Availability check error:", error);
    return { available: false, error: "Failed to check availability." };
  }
}

export interface CreateBookingInput {
  venueId: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: number;
  specialRequests?: string;
}

export async function createBooking(data: CreateBookingInput): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    await dbConnect();

    // Re-check availability just in case
    const isAvailable = await checkVenueAvailability(data.venueId, data.eventDate, data.startTime, data.endTime);
    if (!isAvailable.available) {
      return { success: false, error: "The venue is no longer available for this time slot." };
    }

    const eventDate = new Date(data.eventDate);
    eventDate.setUTCHours(0, 0, 0, 0);

    const booking = await Booking.create({
      user: session.user.id,
      venue: data.venueId,
      eventType: data.eventType,
      eventDate: eventDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guestCount: data.guestCount,
      totalAmount: data.totalAmount,
      specialRequests: data.specialRequests,
      status: "pending",
      paymentStatus: "unpaid",
    });

    return { success: true, bookingId: String(booking._id) };
  } catch (error) {
    console.error("Create booking error:", error);
    return { success: false, error: "Failed to create booking." };
  }
}

export type SlotType = 'morning' | 'afternoon' | 'evening' | 'fullday';

export const SLOT_CONFIG: Record<SlotType, { hours: number; startTime: string; endTime: string }> = {
  morning: { hours: 4, startTime: "08:00", endTime: "12:00" },
  afternoon: { hours: 5, startTime: "12:00", endTime: "17:00" },
  evening: { hours: 6, startTime: "17:00", endTime: "23:00" },
  fullday: { hours: 15, startTime: "08:00", endTime: "23:00" },
};

export async function checkSlotAvailability(venueId: string, eventDate: string) {
  try {
    await dbConnect();
    
    const targetDate = new Date(eventDate);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Get all bookings that are not cancelled
    const bookings = await Booking.find({
      venue: venueId,
      eventDate: targetDate,
      status: { $in: ["confirmed", "pending", "completed"] },
    }).lean();

    // Default all to true
    const slots = {
      morning: { available: true },
      afternoon: { available: true },
      evening: { available: true },
      fullday: { available: true },
    };

    // If there is any fullday booking, all slots are unavailable
    const hasFullday = bookings.some(b => 
      b.startTime === SLOT_CONFIG.fullday.startTime && 
      b.endTime === SLOT_CONFIG.fullday.endTime
    );

    if (hasFullday) {
      return {
        morning: { available: false },
        afternoon: { available: false },
        evening: { available: false },
        fullday: { available: false },
      };
    }

    // Check individual slots based on existing bookings
    // For simplicity, we assume bookings match the SLOT_CONFIG start/end times precisely
    for (const b of bookings) {
      if (b.startTime === SLOT_CONFIG.morning.startTime && b.endTime === SLOT_CONFIG.morning.endTime) {
        slots.morning.available = false;
        slots.fullday.available = false;
      }
      if (b.startTime === SLOT_CONFIG.afternoon.startTime && b.endTime === SLOT_CONFIG.afternoon.endTime) {
        slots.afternoon.available = false;
        slots.fullday.available = false;
      }
      if (b.startTime === SLOT_CONFIG.evening.startTime && b.endTime === SLOT_CONFIG.evening.endTime) {
        slots.evening.available = false;
        slots.fullday.available = false;
      }
    }

    return slots;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    // On error, safely assume unavailable to prevent double bookings
    return {
      morning: { available: false },
      afternoon: { available: false },
      evening: { available: false },
      fullday: { available: false },
    };
  }
}

export async function calculateBookingAmount(venueId: string, bookingType: SlotType): Promise<number> {
  try {
    await dbConnect();
    const Venue = (await import("@/models/Venue")).default;
    
    const venue = await Venue.findById(venueId).select("pricePerHour").lean();
    if (!venue) {
      throw new Error("Venue not found");
    }

    const hours = SLOT_CONFIG[bookingType]?.hours || 0;
    return venue.pricePerHour * hours;
  } catch (error) {
    console.error("Error calculating booking amount:", error);
    return 0;
  }
}
