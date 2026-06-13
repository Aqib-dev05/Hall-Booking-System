import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia", // Matching the installed SDK version
});

export async function POST(req: Request) {
  try {
    // 1. Verify User Session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Request Body
    const body = await req.json();
    const { amount, bookingId, venueId } = body;

    if (!amount || !bookingId || !venueId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Verify the Booking belongs to the user and is still unpaid
    await dbConnect();
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (String(booking.user) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Booking is already paid" }, { status: 400 });
    }

    // 4. Create PaymentIntent
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        bookingId: bookingId,
        venueId: venueId,
        userId: session.user.id,
      },
    });

    // 5. Update booking with the paymentIntentId (for tracking)
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    // 6. Return Client Secret
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("[STRIPE_CREATE_INTENT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
