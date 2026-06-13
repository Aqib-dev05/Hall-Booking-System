"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUserDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = session.user.id;

    const now = new Date();
    
    // Aggregations or direct finds
    const bookings = await Booking.find({ user: userId }).lean();

    const stats = {
      totalBookings: bookings.length,
      upcomingEvents: 0,
      completedEvents: 0,
      totalSpent: 0,
      recentUpcoming: [] as any[],
    };

    for (const b of bookings) {
      const eventDate = new Date(b.eventDate);
      
      // Calculate total spent only on paid & non-cancelled bookings
      if (b.paymentStatus === "paid" && b.status !== "cancelled") {
        stats.totalSpent += b.totalAmount || 0;
      }

      if (b.status === "cancelled") continue;

      if (eventDate >= now) {
        stats.upcomingEvents++;
      } else if (b.status === "completed" || (b.status === "confirmed" && eventDate < now)) {
        stats.completedEvents++;
      }
    }

    // Get 3 upcoming bookings specifically for the preview list
    stats.recentUpcoming = await Booking.find({
      user: userId,
      status: { $in: ["confirmed", "pending"] },
      eventDate: { $gte: now },
    })
      .sort({ eventDate: 1 })
      .limit(3)
      .populate("venue")
      .lean();

    // Ensure we stringify ObjectIds if needed for client components
    stats.recentUpcoming = JSON.parse(JSON.stringify(stats.recentUpcoming));

    return { success: true, stats };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function getUserProfile() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    const user = await User.findById(session.user.id).select("-password").lean();
    if (!user) return { success: false, error: "User not found" };

    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Profile fetch error:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateProfile(data: { name: string; phone?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    await User.findByIdAndUpdate(session.user.id, {
      name: data.name,
      phone: data.phone,
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    const user = await User.findById(session.user.id).select("+password");
    if (!user || !user.password) {
      return { success: false, error: "Account uses an external provider or doesn't have a password set." };
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "Incorrect current password" };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password" };
  }
}
