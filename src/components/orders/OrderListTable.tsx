import { component$, useSignal } from "@builder.io/qwik";
import { EnumUserRole, InterfaceOrder, InterfaceUser } from "~/types/common";
import { LuEye as Eye, LuPencil as Edit, LuTrash2 as Trash2 } from "@qwikest/icons/lucide";
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
}
const deleteOrder = server$(async function(orderId: string) {
    const auth_token = this.cookie.get('auth_token')?.value;
    if (!auth_token) {
        return false;
    }

    const isValid = await verifyJWT(auth_token);
    if (!isValid) {
        return false;
    }
    await connectDB();

    const order = await Order.findById(orderId).lean();

    const partner = await Partner.findById(order?.partnerId).lean();
    if (isValid.role != EnumUserRole.DIRECTOR && isValid._id != order?.userId && !isValid.assignedChannels?.includes(partner?.channelId!) && !isValid.assignedBrands?.includes(order?.brandId!)) {
        return false;
    }

    await Order.deleteOne({ _id: orderId });

    
    return true;
})
export default component$(({ ordersData, currentUser, orderAction }: Props) => {
    return (
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mã Đơn</th>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày Giao</th>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Đối Tác</th>
                        <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sales Rep</th>
                        <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Doanh Thu</th>
                        <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Hành Động</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {ordersData.orders.map(order => (
                        <tr key={order._id}>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{order._id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Intl.DateTimeFormat('en-US').format(new Date(order.deliveryDate))}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{order.partnerId?.name || ""}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.userId?.name || ""}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-800">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalNetPrice || 0)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                                <button onClick$={() => {orderAction.action = 'preview'; orderAction.order = order}} class="text-teal-600 hover:text-teal-900 bg-teal-50 p-2 rounded-lg"><Eye class="w-4 h-4" /></button>
                                {currentUser.role == EnumUserRole.DIRECTOR || currentUser._id == order.userId?._id || currentUser.assignedBrands.includes(order.brandId!) || currentUser.assignedChannels.includes(order.partnerId?.channelId!) ? (
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