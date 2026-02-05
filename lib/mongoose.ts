// lib/mongoose.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });


const MONGODB_URI = process.env.MONGODB_URI;
console.log("✅ MONGODB_URI:", MONGODB_URI);

if (!MONGODB_URI) {
    throw new Error(
        "💥 Please define the MONGODB_URI environment variable inside .env.local"
    );
}


interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Global variable to cache the Mongoose connection
declare global {
    var mongoose: MongooseCache;
}

// Initialize if it doesn't exist
const cached: MongooseCache = global.mongoose || {
    conn: null,
    promise: null,
};

if (!global.mongoose) {
    global.mongoose = cached;
}


async function dbConnect(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            // bufferCommands: false,
            // connectTimeoutMS: 30000,
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // Add other Mongoose options if needed
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts);
    }

    try {
        cached.conn = await cached.promise;

    } catch (error) {
        // Reset cache on error
        cached.promise = null;
        throw new Error(`💥 Database connection failed: ${error}`);
    }

    console.log("👉 Database connected");
    return cached.conn;
}

export default dbConnect;
