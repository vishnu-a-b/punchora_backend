/**
 * Check Database Records
 * Quick script to check User and Staff data
 */

import mongoose from "mongoose";
import { User } from "../modules/user/models/User";
import { Staff } from "../modules/staff/models/Staff";

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Check Users
    const userCount = await User.countDocuments();
    console.log(`📊 Total Users: ${userCount}`);

    const usersWithPhotos = await User.countDocuments({
      photos: { $exists: true, $ne: [] }
    });
    console.log(`📸 Users with photos: ${usersWithPhotos}`);

    if (usersWithPhotos > 0) {
      const sampleUser = await User.findOne({ photos: { $exists: true, $ne: [] } }).lean();
      console.log(`\nSample User with photo:`);
      console.log(`  - ID: ${sampleUser?._id}`);
      console.log(`  - Name: ${sampleUser?.name}`);
      console.log(`  - Photos: ${JSON.stringify(sampleUser?.photos)}`);
    }

    // Check Staff
    const staffCount = await Staff.countDocuments();
    console.log(`\n📊 Total Staff: ${staffCount}`);

    if (staffCount > 0) {
      const sampleStaff = await Staff.findOne().populate("user").lean();
      console.log(`\nSample Staff:`);
      console.log(`  - ID: ${(sampleStaff as any)?._id}`);
      console.log(`  - Name: ${(sampleStaff as any)?.name}`);
      console.log(`  - UID: ${(sampleStaff as any)?.uid}`);
      console.log(`  - User ID: ${(sampleStaff as any)?.user?._id || (sampleStaff as any)?.user}`);
      console.log(`  - User Name: ${(sampleStaff as any)?.user?.name}`);
      console.log(`  - User Photos: ${JSON.stringify((sampleStaff as any)?.user?.photos)}`);
    }

    await mongoose.disconnect();
    console.log("\n👋 Disconnected");
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
