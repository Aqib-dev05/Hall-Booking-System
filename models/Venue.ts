import mongoose, { Schema, Document, Model } from "mongoose";

export type VenueCategory = "party" | "wedding" | "corporate" | "concert" | "birthday" | "other";

export interface IVenue extends Document {
  name: string;
  description: string;
  location: string;
  city: string;
  capacity: number;
  pricePerHour: number;
  category: VenueCategory;
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      enum: ["party", "wedding", "corporate", "concert", "birthday", "other"],
      required: [true, "Category is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Venue: Model<IVenue> =
  mongoose.models.Venue || mongoose.model<IVenue>("Venue", VenueSchema);

export default Venue;
