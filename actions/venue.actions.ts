"use server";

import dbConnect from "@/lib/db";
import Venue, { type IVenue } from "@/models/Venue";

export interface VenueFilters {
  search?: string;
  category?: string;
  capacityRange?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VenueData {
  _id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  capacity: number;
  pricePerHour: number;
  category: string;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
}

export async function getVenues(filters?: VenueFilters): Promise<{
  success: boolean;
  data: VenueData[];
  error?: string;
}> {
  try {
    await dbConnect();

    // Build query object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { isAvailable: true };

    // Search by name or city
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ name: searchRegex }, { city: searchRegex }];
    }

    // Filter by category
    if (filters?.category && filters.category !== "all") {
      query.category = filters.category;
    }

    // Filter by capacity range
    if (filters?.capacityRange) {
      switch (filters.capacityRange) {
        case "small":
          query.capacity = { $lt: 50 };
          break;
        case "medium":
          query.capacity = { $gte: 50, $lte: 100 };
          break;
        case "large":
          query.capacity = { $gte: 100, $lte: 200 };
          break;
        case "xlarge":
          query.capacity = { $gt: 200 };
          break;
      }
    }

    // Filter by price range
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      query.pricePerHour = {};
      if (filters?.minPrice !== undefined) {
        query.pricePerHour.$gte = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        query.pricePerHour.$lte = filters.maxPrice;
      }
    }

    const venues: IVenue[] = await Venue.find(query)
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    // Serialize Mongoose documents to plain objects
    const serialized: VenueData[] = venues.map((v) => ({
      _id: String(v._id),
      name: v.name,
      description: v.description,
      location: v.location,
      city: v.city,
      capacity: v.capacity,
      pricePerHour: v.pricePerHour,
      category: v.category,
      images: v.images,
      amenities: v.amenities,
      isAvailable: v.isAvailable,
      rating: v.rating,
      totalReviews: v.totalReviews,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching venues:", error);
    return {
      success: false,
      data: [],
      error: "Failed to fetch venues. Please try again.",
    };
  }
}

export async function getVenueById(id: string): Promise<{
  success: boolean;
  data?: VenueData;
  error?: string;
}> {
  try {
    await dbConnect();
    const venue = await Venue.findById(id).lean();
    
    if (!venue) {
      return { success: false, error: "Venue not found" };
    }

    const serialized: VenueData = {
      _id: String(venue._id),
      name: venue.name,
      description: venue.description,
      location: venue.location,
      city: venue.city,
      capacity: venue.capacity,
      pricePerHour: venue.pricePerHour,
      category: venue.category,
      images: venue.images || [],
      amenities: venue.amenities || [],
      isAvailable: venue.isAvailable,
      rating: venue.rating || 0,
      totalReviews: venue.totalReviews || 0,
    };

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching venue by ID:", error);
    return { success: false, error: "Failed to fetch venue details" };
  }
}

export interface ReviewData {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getVenueReviews(venueId: string): Promise<{
  success: boolean;
  data: ReviewData[];
  error?: string;
}> {
  try {
    await dbConnect();
    
    // Dynamically import Review and User models if not already registered
    const Review = (await import("@/models/Review")).default;
    const User = (await import("@/models/User")).default;

    const reviews = await Review.find({ venue: venueId })
      .populate({ path: "user", select: "name", model: User })
      .sort({ createdAt: -1 })
      .lean();

    const serialized = reviews.map((r: any) => ({
      _id: String(r._id),
      userName: r.user?.name || "Unknown User",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching venue reviews:", error);
    return { success: false, data: [], error: "Failed to fetch reviews" };
  }
}

