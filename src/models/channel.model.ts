import {Schema, model, Types} from 'mongoose';

const ChannelSchema = new Schema({
    _id: {type: String, required: true, default: () => new Types.ObjectId().toString() },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
}, { timestamps: true });

export const Channel = model('channels', ChannelSchema);

Channel.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Channel model:', err);
});