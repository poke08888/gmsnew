import { component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";

import { EnumUserCustomPermission, EnumUserRole, InterfaceOrder, InterfaceUser } from "~/types/common";

import { LuUsers, LuFilter, LuChevronRight } from "@qwikest/icons/lucide";
import { routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";
import { Order } from "~/models/order.model";
import { Channel } from "~/models/channel.model";
import { connectDB } from "~/libs/db";
import { verifyJWT } from "~/services/hash.service";
import { Brand } from "~/models/brand.model";
import { User } from "~/models/user.model";
const useBrands = routeLoader$(async ({ sharedMap }) => {
    const user = sharedMap.get("user");
    await connectDB();
    return await Brand.find({}).lean();
})

const GetOrdersAndPartners = server$(async function (brandId: string) {
    const session = this.sharedMap.get('session');
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }
    await connectDB();
    const user = await User.findOne({ _id: session.user._id });
    if (!user) return [];

    let isAdmin = false
    if (user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) {
        isAdmin = true;
    }

    await connectDB();
    // User based filter
    let matchQuery: any = {}
    if (!isAdmin) {
        matchQuery = {
            $or: [
                { brandId: { $in: user.assignedBrands } },
                { userId: user._id },

            ]
        };
    }
    if (brandId != "all") {
        matchQuery = {
            $and: [
                matchQuery,
                { brandId: brandId }
            ]
        };
    }
    // assign permissions

    return await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$partnerId",
                orderCount: { $sum: 1 }, // Tổng số đơn hàng của partner này
                totalNetValue: {
                    $sum: {
                        $reduce: {
                            input: "$items",
                            initialValue: 0,
                            in: { $add: ["$$value", { $multiply: ["$$this.qty", "$$this.netprice"] }] }
                        }
                    } // Tổng tiền (tính trực tiếp từ mảng items)
                },
                lastOrderDate: { $max: "$orderDate" }, // Ngày đặt hàng gần nhất
                // Lưu trữ danh sách ID đơn hàng nếu cần
                orderIds: { $push: "$_id" }
            }
        },
        {
            $lookup: {
                from: "partners",       // Tên collection trong DB (thường là số nhiều)
                localField: "_id",      // _id lúc này chính là partnerId từ bước group
                foreignField: "_id",    // _id của collection partners
                as: "partnerDetails"    // Tên mảng chứa kết quả trả về
            }
        },
        {
            $unwind: {
                path: "$partnerDetails",
                preserveNullAndEmptyArrays: true // Giữ lại nếu lỡ partner bị xóa khỏi DB
            }
        },
        {
            $lookup: {
                from: "channels", // Tên collection chứa thông tin channel
                localField: "partnerDetails.channelId",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ])

})

export default component$(() => {

    const nav = useNavigate();

    const selectedBrandId = useSignal("all");
    const brands = useBrands();
    const orderPartners = useSignal<any[]>([]);
    useTask$(async ({ track }) => {
        track(() => selectedBrandId.value);
        // console.log("Selected Brand ID:", selectedBrandId.value); 
        const orders = await GetOrdersAndPartners(selectedBrandId.value)
        orderPartners.value = orders as any[];
        // console.log("Orders by Partners:", JSON.stringify(orders, null, 2));
    });

    return (
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LuUsers class="w-6 h-6 text-indigo-600" />
                        Chi Tiết Khách Hàng
                    </h1>
                </div>

                <div class="flex flex-col sm:flex-row gap-2">
                    <div class="relative">
                        <select value={selectedBrandId.value} onChange$={(e) => selectedBrandId.value = (e.target as HTMLSelectElement).value} class="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-9 pr-8 rounded-lg outline-none focus:border-indigo-500">
                            <option value="all">Tất cả thương hiệu</option>
                            {brands.value.map((brand: any) => (
                                <option value={brand._id as string}>{brand.name}</option>
                            ))}
                        </select>
                        <LuFilter class="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Đối Tác</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kênh</th>
                            <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Doanh Thu</th>
                            <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Số Đơn</th>
                            <th class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {orderPartners.value.map((partnerData: any) => (
                            <tr onClick$={async () => { await nav(`/dashboard/partners/${partnerData._id}`) }} key={partnerData._id} class="hover:bg-indigo-50 cursor-pointer transition-colors">
                                <td class="px-6 py-4 text-sm font-bold text-gray-900">{partnerData.partnerDetails?.name}</td>
                                <td class="px-6 py-4 text-sm">
                                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{partnerData.channelDetails?.name}</span>
                                </td>
                                <td class="px-6 py-4 text-right text-sm font-bold text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(partnerData.totalNetValue)}
                                </td>
                                <td class="px-6 py-4 text-right text-sm text-gray-700">{partnerData.orderCount}</td>
                                <td class="px-6 py-4 text-center">
                                    <LuChevronRight class="w-5 h-5 text-gray-400 inline-block" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
})