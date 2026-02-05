import { connectDB } from '~/libs/db';

import { Partner } from '~/models/partner.model';
import { Warehouse } from '~/models/warehouse.model';
import { Billing } from '~/models/billing.model';
import { InterfacePartner } from '~/types/common';
import mongoose from 'mongoose';
export const CreateOrUpdatePartner = async (partner: any): Promise<boolean> => {
    await connectDB();
    try {
    let partnerDoc = partner as any;    
    partnerDoc.warehouses = partner.warehouses?.map((warehouse: any) => warehouse._id);
    partnerDoc.billings = partner.billings?.map((billing: any) => billing._id);
    let {_id, ...partnerData} = partnerDoc;
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
        const newPartner = new Partner(partnerData);
        const result = await newPartner.save();
        return true;
    }

    const result = await Partner.findOneAndUpdate(
        { _id },
        { $set: partnerData },
        { new: true, upsert: true, runValidators: true }
    )
    } catch (error) {
        console.error('Error in CreateOrUpdatePartner:', error);
        return false;
    }
    return true;
}

export const deletePartner = async (partnerId: string): Promise<boolean> => {
    await connectDB();

    await Partner.deleteOne({ _id: partnerId });
    return true;
}

export const GetAllPartners = async (): Promise<any[]> => {
    await connectDB();
    const partners = await Partner.find({}, { __v: 0 }).populate('warehouses billings channelId').lean();
    return partners as any[];
}