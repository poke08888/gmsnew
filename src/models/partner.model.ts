import {Schema, model, Types} from 'mongoose';

const PartnerSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    name: { type: String, required: true, unique: true },
    channelId: { type: String, ref: 'channels', required: true },
    warehouses: { type: [{ type: String, ref: 'warehouses' }], default: [] },
    billings: { type: [{ type: String, ref: 'billings' }], default: [] },
    notes: { type: [{ type: {_id: false, date: Date, content: String, userId: String } }], default: [] },
}, { timestamps: true });

export const Partner = model('partners', PartnerSchema);

Partner.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Partner model:', err);
});