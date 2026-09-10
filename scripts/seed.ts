import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../server/lib/mongodb";
import { Admin, Settings } from "../server/models";

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL || "admin@rajasthanexamtwister.com").toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || "AdminSecurePassword123!";
  const name = "System Administrator";

  console.log("Connecting to MongoDB...");
  await connectToDatabase();
  console.log("Connected successfully.");

  console.log(`Checking existing admin with email: ${email}...`);
  const existingAdmin = await Admin.findOne({ email });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existingAdmin) {
    console.log("Admin user already exists. Updating password hash...");
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.name = name;
    await existingAdmin.save();
    console.log("Admin user updated successfully.");
  } else {
    console.log("Creating initial admin user...");
    const admin = await Admin.create({
      email,
      passwordHash,
      name,
    });
    console.log(`Admin user created with ID: ${admin._id}`);
  }

  // Ensure default singleton settings document exists
  const existingSettings = await Settings.findById("singleton");
  if (!existingSettings) {
    await Settings.create({
      _id: "singleton",
      siteTitle: "Rajasthan Exam Twister",
      siteTagline: "Rajasthan Competitive Exam Preparation & Master Revision Hub",
      contactEmail: email,
    });
    console.log("Default singleton settings initialized.");
  }
}

main()
  .then(() => {
    console.log("Database seed completed successfully.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  });
