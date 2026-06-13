"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface StripePaymentFormProps {
  clientSecret: string;
  totalAmount: number;
  bookingId: string;
  onBack: () => void;
}

export default function StripePaymentForm({
  clientSecret,
  totalAmount,
  bookingId,
  onBack,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    setIsProcessing(false);

    if (error) {
      // Show error to your customer (e.g., insufficient funds, card declined)
      toast.error("Payment failed", { description: error.message });
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast.success("Payment successful!");
      // Redirect to confirmation page
      router.push(`/booking/confirmation/${bookingId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="p-4 border border-border/50 bg-background/50 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#e4e4e7", // text-zinc-200 for dark mode
                  "::placeholder": {
                    color: "#71717a", // text-zinc-500
                  },
                  iconColor: "#e4e4e7",
                },
                invalid: {
                  color: "#ef4444", // text-red-500
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            `Pay $${totalAmount.toLocaleString()}`
          )}
        </Button>
      </div>
    </form>
  );
}
