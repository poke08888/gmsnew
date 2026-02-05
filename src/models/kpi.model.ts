import { Schema, model, models, Types } from 'mongoose';

import { EnumKPIType } from '~/types/common';

const KPISchema = new Schema({
    _id: { type: String, required: true, default: () => new Types.ObjectId().toString() },
    type: { type: String, enum: Object.values(EnumKPIType), required: true },
    targetId: { type: String, required: true },
    period: { type: String, enum: ['MONTH', 'QUARTER', 'YEAR'], required: true },
    timeframe: { type: String, required: true },
    amount: { type: Number, required: true },
}, { timestamps: true });

export const KPI = model('kpis', KPISchema);

KPI.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for KPI model:', err);
})