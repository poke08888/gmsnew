import { Schema, Types, model } from 'mongoose';

const ProductSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    orders: [{ type: String, ref: 'orders' }]
}, { timestamps: true });

export const Product = model('products', ProductSchema);

Product.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Product model:', err);
});