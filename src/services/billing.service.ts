import { connectDB } from '~/libs/db';

import { Partner } from '~/models/partner.model';
import { Warehouse } from '~/models/warehouse.model';
import { Billing } from '~/models/billing.model';
import { InterfaceBilling } from '~/types/common';
import mongoose from 'mongoose';
export const CreateOrUpdateBilling = async (billing: InterfaceBilling): Promise<any> => {
    await connectDB();

    let billingDoc = billing as any;
    let {_id, ...billingData} = billingDoc;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
        const newBilling = new Billing(billingData);
        const result = await newBilling.save();
        return result;
    }
    const result = await Billing.findOneAndUpdate(
        { _id },
        { $set: billingData },
        { new: true, upsert: true, runValidators: true }
    )
    return result;
}

export const GetBillingById = async (billingId: string): Promise<InterfaceBilling | null> => {
    try {
        await connectDB();
        const billing = await Billing.findById(billingId).lean();
        return billing as InterfaceBilling | null;
    } catch (error) {
        console.error('Error fetching billing by ID:', error);
        return null;
    }
}

export const GetAllBillings = async (): Promise<InterfaceBilling[]> => {
    await connectDB();
    const billings = await Billing.find({}, { __v: 0 }).lean();
    return billings as InterfaceBilling[];
}