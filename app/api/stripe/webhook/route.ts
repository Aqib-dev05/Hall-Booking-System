import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

import { sendBookingConfirmationEmail, sendAdminNewBookingAlert } from "@/lib/email";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    await dbConnect();

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, {
          status: "confirmed",
          paymentStatus: "paid",
        }, { new: true }).populate("venue user");

        if (updatedBooking) {
          const bookingObj = updatedBooking as any;
          if (bookingObj.user && bookingObj.user.email) {
            // Send confirmation to user
            await sendBookingConfirmationEmail(bookingObj.user.email, bookingObj);
            
            // Send alert to admin
            await sendAdminNewBookingAlert(bookingObj, bookingObj.user.email, bookingObj.user.name || "Customer");
          }
          console.log(`Booking ${bookingId} confirmed via webhook and emails sent.`);
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          paymentStatus: "unpaid",
        });
        console.log(`Payment failed for booking ${bookingId} via webhook.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
