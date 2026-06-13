"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * Server Action to test Mongoose DB Connection and fetch stats
 */
export async function testDatabaseConnection() {
  try {
    console.log("Attempting database connection...");
    
    // Connect to the DB
    await dbConnect();
    
    // Fetch user count as a quick stats check
    const userCount = await User.countDocuments().catch(() => 0);
    
    return {
      success: true,
      message: "Successfully connected to MongoDB via Mongoose!",
      data: {
        isConnected: true,
        userCount,
        dbName: "wedding-venue"
      }
    };
  } catch (error) {
    console.error("Database connection failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to the database",
      data: {
        isConnected: false,
        userCount: 0
      }
    };
  }
}
