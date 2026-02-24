import {Schema, model, Types} from 'mongoose';

const WarehouseSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    name: { type: String, required: true, default: '' },
    location: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
}, { timestamps: true });

export const Warehouse = model('warehouses', WarehouseSchema);

Warehouse.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Warehouse model:', err);
});