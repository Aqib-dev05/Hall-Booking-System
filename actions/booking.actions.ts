"use server";

import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { auth } from "@/lib/auth";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { sendCancellationEmail } from "@/lib/email";

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

export type BookingFilter = "all" | "upcoming" | "past" | "cancelled";

export async function getUserBookings(filter: BookingFilter = "all") {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized", bookings: [] };

    await dbConnect();
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = { user: session.user.id };

    switch (filter) {
      case "upcoming":
        query.eventDate = { $gte: now };
        query.status = { $in: ["confirmed", "pending"] };
        break;
      case "past":
        query.$or = [
          { eventDate: { $lt: now }, status: { $ne: "cancelled" } },
          { status: "completed" },
        ];
        break;
      case "cancelled":
        query.status = "cancelled";
        break;
    }

    const bookings = await Booking.find(query)
      .sort({ eventDate: -1 })
      .populate("venue", "name city images")
      .lean();

    return { success: true, bookings: JSON.parse(JSON.stringify(bookings)) };
  } catch (error) {
    console.error("Get user bookings error:", error);
    return { success: false, error: "Failed to fetch bookings", bookings: [] };
  }
}

export async function getBookingById(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const booking = await Booking.findById(bookingId)
      .populate("venue")
      .lean();

    if (!booking) return { success: false, error: "Booking not found" };
    if (String(booking.user) !== session.user.id) return { success: false, error: "Forbidden" };

    return { success: true, booking: JSON.parse(JSON.stringify(booking)) };
  } catch (error) {
    console.error("Get booking error:", error);
    return { success: false, error: "Failed to fetch booking" };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const booking = await Booking.findById(bookingId).populate("venue");

    if (!booking) return { success: false, error: "Booking not found" };
    if (String(booking.user) !== session.user.id) return { success: false, error: "Forbidden" };

    if (booking.status === "cancelled") {
      return { success: false, error: "Booking is already cancelled" };
    }

    // Enforce 48-hour cancellation policy
    const eventDate = new Date(booking.eventDate);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 48) {
      return { success: false, error: "Cannot cancel bookings less than 48 hours before the event." };
    }

    booking.status = "cancelled";
    await booking.save();

    // Send cancellation email
    try {
      const User = (await import("@/models/User")).default;
      const user = await User.findById(session.user.id);
      if (user?.email) {
        await sendCancellationEmail(user.email, booking);
      }
    } catch (emailError) {
      console.error("Cancellation email failed:", emailError);
      // Don't block the cancellation if email fails
    }

    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    console.error("Cancel booking error:", error);
    return { success: false, error: "Failed to cancel booking" };
  }
}
