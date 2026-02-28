import {Schema, model, Types} from 'mongoose';
import { EnumUserRole } from '~/types/common';
const UserSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: Object.values(EnumUserRole), default: () => EnumUserRole.STAFF },
    assignedChannels: { type: [{ type: String, ref: 'channels' }], default: () => [] },
    assignedBrands: { type: [{ type: String, ref: 'brands' }], default: () => [] },
    customPermissions: { type: [String], default: () => [] },
}, { timestamps: true })

export const User = model('users', UserSchema);

User.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for User model:', err);
});