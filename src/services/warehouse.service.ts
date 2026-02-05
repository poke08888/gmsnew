import { connectDB } from '~/libs/db';

import { Partner } from '~/models/partner.model';
import { Warehouse } from '~/models/warehouse.model';
import { Billing } from '~/models/billing.model';
import { InterfaceWarehouse } from '~/types/common';
import mongoose from 'mongoose';
export const CreateOrUpdateWarehouse = async (warehouse: InterfaceWarehouse): Promise<any> => {
    await connectDB();

    let warehouseDoc = warehouse as any;

    let {_id, ...warehouseData} = warehouseDoc;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
        const newWarehouse = new Warehouse(warehouseData);
        const result = await newWarehouse.save();
        return result;
    }

    const result = await Warehouse.findOneAndUpdate(
        { _id },
        { $set: warehouseData },
        { new: true, upsert: true, runValidators: true }
    )
    return result;
}

export const GetAllWarehouses = async (): Promise<InterfaceWarehouse[]> => {
    await connectDB();
    const list = await Warehouse.find({}, { __v: 0 }).lean();
    return list as InterfaceWarehouse[];
}