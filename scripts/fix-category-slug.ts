import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/lib/mongodb";
import { Category } from "../server/models/Category";

async function main() {
  await connectToDatabase();
  const cat = await Category.findOne({ name: "राजस्थान का इतिहास" });
  if (cat && cat.slug === "untitled") {
    cat.slug = "rajasthan-ka-itihas";
    await cat.save();
    console.log(`Updated category slug to: ${cat.slug}`);
  } else if (cat) {
    console.log(`Category already has slug: ${cat.slug}`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
