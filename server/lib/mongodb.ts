import mongoose from "mongoose";
import dns from "dns"

if (process.env.NODE_ENV !== "production") {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {
    // Ignore in environments where custom DNS servers are restricted
  }
}
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/rajasthan_exam_twister";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/rajasthan_exam_twister";

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
