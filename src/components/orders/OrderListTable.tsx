//@ts-nocheck
import { component$, useSignal } from "@builder.io/qwik";
import { EnumUserRole, InterfaceOrder, InterfaceUser } from "~/types/common";
import { LuEye as Eye, LuPencil as Edit, LuTrash2 as Trash2, LuPaperclip } from "@qwikest/icons/lucide";
import { DeleteOrderById } from "~/services/order.service";
import { server$ } from "@builder.io/qwik-city";
import { verifyJWT } from "~/services/hash.service";
import { User } from "~/models/user.model";
import { Order } from "~/models/order.model";
import { Partner } from "~/models/partner.model";
import { connectDB } from "~/libs/db";
interface Props {
    ordersData: {orders: InterfaceOrder[], total: number},
    currentUser: InterfaceUser
    orderAction: { action: string, order: InterfaceOrder | null}
    sortBy?: string,
    onSortChange$?: (sortBy: string) => void,
}
const deleteOrder = server$(async function(orderId: string) {
    const session = this.sharedMap.get('session');
    if (!session) {
        return false;
    }

    await connectDB();
    const isValid = await User.findOne({ _id: session.user._id });
    if (!isValid) {
        return false;
    }

    const order = await Order.findById(orderId).lean();

    const partner = await Partner.findById(order?.partnerId).lean();
    if (isValid.role != EnumUserRole.DIRECTOR && isValid._id != order?.userId && !isValid.assignedChannels?.includes(partner?.channelId!) && !isValid.assignedBrands?.includes(order?.brandId!)) {
        return false;
    }

    await Order.deleteOne({ _id: orderId });

    
    return true;
})
export default component$(({ ordersData, currentUser, orderAction, sortBy, onSortChange$ }: Props) => {
    return (
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tên / Mã Đơn</th>
                        <th
                            class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer select-none"
                            onClick$={() => onSortChange$ && onSortChange$((sortBy === 'orderDate-desc') ? 'orderDate-asc' : 'orderDate-desc')}
                        >
                            Ngày Đặt
                            <span class="ml-2">{sortBy?.startsWith('orderDate') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer select-none"
                            onClick$={() => onSortChange$ && onSortChange$((sortBy === 'deliveryDate-desc') ? 'deliveryDate-asc' : 'deliveryDate-desc')}
                        >
                            Ngày Giao
                            <span class="ml-2">{sortBy?.startsWith('deliveryDate') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Đối Tác</th>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sales Rep</th>
                        <th
                            class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase cursor-pointer select-none"
                            onClick$={() => onSortChange$ && onSortChange$((sortBy === 'revenue-desc') ? 'revenue-asc' : 'revenue-desc')}
                        >
                            Doanh Thu
                            <span class="ml-2">{sortBy?.startsWith('revenue') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                        </th>
                        <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Hành Động</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {ordersData.orders.map(order => (
                        <tr key={order._id}>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{order.orderCode || order._id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Intl.DateTimeFormat('en-US').format(new Date(order.orderDate))}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Intl.DateTimeFormat('en-US').format(new Date(order.deliveryDate))}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{typeof order.partnerId === 'string' ? order.partnerId : order.partnerId?.name || ""}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{typeof order.userId === 'string' ? order.userId : order.userId?.name || ""}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-800">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalNetPrice || 0)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                                <button onClick$={() => {orderAction.action = 'preview'; orderAction.order = order}} class="text-teal-600 hover:text-teal-900 bg-teal-50 p-2 rounded-lg"><Eye class="w-4 h-4" /></button>
                                <button onClick$={() => {orderAction.action = 'order-slip'; orderAction.order = order}} class="text-amber-600 hover:text-amber-900 bg-amber-50 p-2 rounded-lg"><LuPaperclip class="w-4 h-4" /></button>
                                {currentUser.role == EnumUserRole.DIRECTOR || currentUser._id == order.userId?._id || currentUser.assignedBrands.includes(typeof order.brandId === 'string' ? order.brandId : order.brandId?._id) || currentUser.assignedChannels.includes(order.partnerId?.channelId!) ? (
                                    <>
                                        <button onClick$={() => {orderAction.action = 'edit'; orderAction.order = order}} class="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg"><Edit class="w-4 h-4" /></button>
                                        <button onClick$={async () => { await deleteOrder(order._id!); window.location.reload() }} class="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg"><Trash2 class="w-4 h-4" /></button>
                                    </>
                                ): null}
                                
                                
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
})
