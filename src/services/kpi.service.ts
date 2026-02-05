import { KPI } from "~/models/kpi.model";
import { connectDB } from "~/libs/db";
export const addKPI = async (type: string, targetId: string, period: string, timeframe: string, amount: number): Promise<boolean> => {
    await connectDB();

    const newKPI = new KPI({ type, targetId, period, timeframe, amount });
    await newKPI.save();
    return true;
}

export const deleteKPI = async (kpiId: string): Promise<boolean> => {
    await connectDB();

    await KPI.deleteOne({ _id: kpiId });
    return true;
}