import mongoose from "mongoose";

export async function initMongoDB(): Promise<undefined> {
  try {
    await mongoose.connect(process.env.MONGO_URI!, { dbName: "cipher" });
    console.log("[✓] Connected to MongoDB Cluster");
  } catch (e) {
    console.error(e);
  }
}
