import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { sendBookingReminderEmail } from "@/lib/email";

// This prevents Next.js from caching the route
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Basic security for cron (Vercel sets x-vercel-cron header or similar)
    // For local testing, you can hit this route directly, but in prod you should verify the header
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET && 
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Calculate "tomorrow"
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    // Find confirmed bookings for tomorrow where a reminder hasn't been sent yet
    const bookings = await Booking.find({
      status: "confirmed",
      reminderSent: false,
      eventDate: {
        $gte: tomorrowStart,
        $lte: tomorrowEnd,
      },
    }).populate("venue user");

    let sentCount = 0;

    for (const booking of bookings) {
      const b = booking as any;
      if (b.user && b.user.email) {
        // Send email
        await sendBookingReminderEmail(b.user.email, b);
        
        // Mark as sent
        booking.reminderSent = true;
        await booking.save();
        
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, processed: bookings.length, sent: sentCount });
  } catch (error: any) {
    console.error("[CRON_REMINDERS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
