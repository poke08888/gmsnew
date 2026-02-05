import mongoose from 'mongoose';

import '../models/partner.model';
import '../models/user.model';
import '../models/warehouse.model';
import '../models/billing.model';
import '../models/brand.model';
import '../models/kpi.model';
import '../models/channel.model';
import '../models/order.model';
import '../models/product.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gms';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}