"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock, Eye, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getUserBookings, cancelBooking, type BookingFilter } from "@/actions/booking.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TABS: { label: string; value: BookingFilter }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
  { label: "Cancelled", value: "cancelled" },
];

const statusConfig: Record<string, { className: string }> = {
  pending: { className: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
  confirmed: { className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
  cancelled: { className: "border-red-500/30 text-red-500 bg-red-500/10" },
  completed: { className: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" },
};

export default function BookingsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as BookingFilter) || "all";

  const [filter, setFilter] = useState<BookingFilter>(initialFilter);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async (f: BookingFilter) => {
    setIsLoading(true);
    const result = await getUserBookings(f);
    setBookings(result.bookings || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings(filter);
  }, [filter]);

  const handleFilterChange = (newFilter: BookingFilter) => {
    setFilter(newFilter);
    router.replace(`/dashboard/bookings?filter=${newFilter}`, { scroll: false });
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      setCancellingId(null);
      if (result.success) {
        toast.success("Booking cancelled successfully.");
        fetchBookings(filter);
      } else {
        toast.error("Cancellation failed", { description: result.error });
      }
    });
  };

  const canCancelBooking = (booking: any) => {
    if (booking.status === "cancelled" || booking.status === "completed") return false;
    const eventDate = new Date(booking.eventDate);
    const now = new Date();
    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 48;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground mt-1">View and manage all your venue bookings.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20">
              <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bookings found.</p>
              <Button asChild className="mt-4">
                <Link href="/venues">Browse Venues</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Venue</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => (
                  <TableRow key={booking._id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-muted overflow-hidden shrink-0">
                          {booking.venue?.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={booking.venue.images[0]}
                              alt={booking.venue.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.venue?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{booking.venue?.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(booking.eventDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {booking.startTime} - {booking.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig[booking.status]?.className || ""}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${booking.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/bookings/${booking._id}`}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                        {canCancelBooking(booking) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={cancellingId === booking._id}
                              >
                                {cancellingId === booking._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" /> Cancel
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Your booking at{" "}
                                  <span className="font-semibold text-foreground">
                                    {booking.venue?.name}
                                  </span>{" "}
                                  will be cancelled and a refund will be processed in 5–7 business days.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancel(booking._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, Cancel Booking
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
