"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Search, Loader2 } from "lucide-react";
import { getAllBookingsAdmin, updateBookingStatus } from "@/actions/admin.actions";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBookings = async (q: string) => {
    setLoading(true);
    const res = await getAllBookingsAdmin(q);
    if (res.success) {
      setBookings(res.bookings);
    } else {
      toast.error("Failed to load bookings");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings(debouncedSearch);
  }, [debouncedSearch]);

  const handleStatusUpdate = (id: string, newStatus: string, currentPaymentStatus: string) => {
    startTransition(async () => {
      // If marking as confirmed, typically paymentStatus should be paid or something else. 
      // We will just let admin override status.
      const res = await updateBookingStatus(id, newStatus, currentPaymentStatus);
      if (res.success) {
        toast.success("Status updated successfully");
        setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: newStatus } : b));
      } else {
        toast.error("Failed to update status", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">All Bookings</h1>
        <p className="text-slate-500 mt-1">Manage and update all platform bookings.</p>
      </div>

      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 w-full max-w-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by customer or venue..." 
          className="border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead>Customer</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Event Date & Time</TableHead>
              <TableHead>Amount & Payment</TableHead>
              <TableHead className="w-[180px]">Booking Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{booking.user?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{booking.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{booking.venue?.name || "Deleted Venue"}</p>
                    <p className="text-xs text-slate-500 capitalize">{booking.eventType} • {booking.guestCount} guests</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-900 dark:text-slate-100">{format(new Date(booking.eventDate), "MMM d, yyyy")}</p>
                    <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${booking.totalAmount}</p>
                    <Badge variant="outline" className={`mt-1 text-xs ${
                      booking.paymentStatus === "paid" ? "text-emerald-600 border-emerald-200" : 
                      booking.paymentStatus === "unpaid" ? "text-amber-600 border-amber-200" : 
                      "text-slate-600 border-slate-200"
                    }`}>
                      {booking.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={booking.status} 
                      onValueChange={(val) => handleStatusUpdate(booking._id, val, booking.paymentStatus)}
                      disabled={isPending}
                    >
                      <SelectTrigger className={`h-8 text-xs ${
                        booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
