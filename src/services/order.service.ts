import { connectDB } from '~/libs/db';
import { Order } from '../models/order.model';
import { InterfaceOrder, InterfaceOrderItem } from '../types/common';

export const CreateOrder = async (data: InterfaceOrder) => {
	await connectDB();
	const newOrder = new Order(data);
	await newOrder.save();
	return newOrder;
}

export const UpdateOrder = async (orderId: string, data: Partial<InterfaceOrder>) => {
	await connectDB();
	await Order.updateOne({ _id: orderId }, data);
	return true;
}

export const DeleteOrderById = async (orderId: string) => {
    await connectDB();
    await Order.deleteOne({ _id: orderId });
    return true;
}