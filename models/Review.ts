import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  venue: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    venue: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue reference is required"],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// We can add a post-save hook or statics to calculate the venue's average rating automatically
ReviewSchema.statics.calculateAverageRating = async function(venueId: Types.ObjectId) {
  const stats = await this.aggregate([
    {
      $match: { venue: venueId }
    },
    {
      $group: {
        _id: "$venue",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model("Venue").findByIdAndUpdate(venueId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    } else {
      await mongoose.model("Venue").findByIdAndUpdate(venueId, {
        rating: 0,
        totalReviews: 0,
      });
    }
  } catch (error) {
    console.error("Error updating average rating on Venue:", error);
  }
};

// Call calculateAverageRating after save
ReviewSchema.post("save", async function() {
  const model = this.constructor as any;
  await model.calculateAverageRating(this.venue);
});

// Call calculateAverageRating after removing review
ReviewSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    const model = mongoose.model("Review") as any;
    await model.calculateAverageRating(doc.venue);
  }
});

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
