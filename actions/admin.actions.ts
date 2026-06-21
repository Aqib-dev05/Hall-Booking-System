"use server";

import dbConnect from "@/lib/db";
import Venue from "@/models/Venue";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Ensure only admins can execute these actions
const verifyAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user || user.role !== "admin") throw new Error("Forbidden: Admins only");
  return user;
};

// --- Dashboard Analytics ---
export async function getAdminDashboardStats() {
  try {
    await verifyAdmin();

    const [totalVenues, totalBookings, totalUsers] = await Promise.all([
      Venue.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: "customer" }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Revenue this month
    const thisMonthBookings = await Booking.find({
      paymentStatus: "paid",
      status: { $ne: "cancelled" },
      createdAt: { $gte: startOfMonth },
    }).lean();
    
    const revenueThisMonth = thisMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const pendingBookings = await Booking.countDocuments({ status: "pending" });

    // Recent 5 bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("venue", "name")
      .populate("user", "name email")
      .lean();

    // Chart Data: Last 6 months revenue
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthBookings = await Booking.find({
        paymentStatus: "paid",
        status: { $ne: "cancelled" },
        createdAt: { $gte: start, $lte: end },
      });
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      chartData.push({
        name: start.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue,
      });
    }

    return {
      success: true,
      stats: {
        totalVenues,
        totalBookings,
        revenueThisMonth,
        pendingBookings,
        totalUsers,
        recentBookings: JSON.parse(JSON.stringify(recentBookings)),
        chartData,
      },
    };
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return { success: false, error: error.message || "Failed to fetch stats" };
  }
}

// --- Venue CRUD ---
export async function getAllVenuesAdmin() {
  try {
    await verifyAdmin();
    const venues = await Venue.find().sort({ createdAt: -1 }).lean();
    return { success: true, venues: JSON.parse(JSON.stringify(venues)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createVenue(data: any) {
  try {
    await verifyAdmin();
    const newVenue = await Venue.create(data);
    revalidatePath("/admin/venues");
    revalidatePath("/venues");
    return { success: true, venueId: newVenue._id.toString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateVenue(id: string, data: any) {
  try {
    await verifyAdmin();
    await Venue.findByIdAndUpdate(id, data);
    revalidatePath("/admin/venues");
    revalidatePath(`/venues/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteVenue(id: string) {
  try {
    await verifyAdmin();
    await Venue.findByIdAndDelete(id);
    revalidatePath("/admin/venues");
    revalidatePath("/venues");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Bookings Management ---
export async function getAllBookingsAdmin(searchQuery = "") {
  try {
    await verifyAdmin();
    let query: any = {};
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("venue", "name")
      .populate("user", "name email")
      .lean();

    let filtered = bookings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = bookings.filter((b: any) => 
        (b.user?.name && b.user.name.toLowerCase().includes(q)) ||
        (b.venue?.name && b.venue.name.toLowerCase().includes(q))
      );
    }

    return { success: true, bookings: JSON.parse(JSON.stringify(filtered)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBookingStatus(id: string, status: string, paymentStatus: string) {
  try {
    await verifyAdmin();
    await Booking.findByIdAndUpdate(id, { status, paymentStatus });
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Users Management ---
export async function getAllUsersAdmin() {
  try {
    await verifyAdmin();
    const users = await User.find().sort({ createdAt: -1 }).select("-password").lean();
    return { success: true, users: JSON.parse(JSON.stringify(users)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
