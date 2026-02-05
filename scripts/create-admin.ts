#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";

// Load environment variables
require("dotenv").config({ path: "../.env" });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error("❌ MONGODB_URI not found in environment variables");
            process.exit(1);
        }

        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const name = await question("Enter admin name: ");
        const email = await question("Enter admin email: ");
        const password = await question("Enter admin password: ");

        if (!name || !email || !password) {
            console.error("❌ All fields are required");
            process.exit(1);
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            console.error("❌ Invalid email format");
            process.exit(1);
        }

        if (password.length < 6) {
            console.error("❌ Password must be at least 6 characters");
            process.exit(1);
        }

        const User = mongoose.model(
            "User",
            new mongoose.Schema({
                email: String,
                password: String,
                name: String,
                role: String,
            }),
        );

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.error("❌ User with this email already exists");
            process.exit(1);
        }

        console.log("🔐 Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("👤 Creating admin user...");
        const adminUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "admin",
        });

        await adminUser.save();

        console.log("✅ Admin user created successfully!");
        console.log("\nLogin credentials:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("\n⚠️  Please save these credentials in a secure location");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

console.log("=================================");
console.log("Create Admin User");
console.log("=================================\n");

createAdminUser();