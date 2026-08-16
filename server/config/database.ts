import mongoose from 'mongoose';
import { MONGODB_URI } from './env';

let isConnected = false;

// Connects to MongoDB via Mongoose. Returns false (instead of throwing) when
// Mongo is unreachable so the server can keep running in-memory only.
export async function connectDatabase(): Promise<boolean> {
  try {
    // Fail fast (rather than buffering forever) when Mongo is unavailable,
    // letting the game service fall back to in-memory-only operation.
    mongoose.set('bufferCommands', false);

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log(`MongoDB connected (${MONGODB_URI})`);
    return true;
  } catch (err) {
    isConnected = false;
    console.error(
      `MongoDB connection failed (${MONGODB_URI}):`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
