import 'dotenv/config';

export const PORT = Number(process.env.PORT || 3000);

export const NODE_ENV = process.env.NODE_ENV || 'development';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/big-two-arena';

// Abandoned rooms expire from the database after this long.
export const ROOM_TTL_SECONDS = Number(process.env.ROOM_TTL_SECONDS || 60 * 60 * 24);
