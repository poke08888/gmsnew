import {Schema, model, Types} from 'mongoose';

const BrandSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
}, { timestamps: true });

export const Brand = model('brands', BrandSchema);

Brand.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Brand model:', err);
});