import {Schema, model, Types} from 'mongoose';

const BillingSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    name: { type: String, required: true, default: '' },
    location: { type: String, default: '' },
    taxNumber: { type: String, default: '' },
}, { timestamps: true });

export const Billing = model('billings', BillingSchema);

Billing.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Billing model:', err);
});