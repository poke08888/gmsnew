import { component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";

import { EnumUserCustomPermission, EnumUserRole } from "~/types/common";

import { LuUsers, LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
import { routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";
import { Order } from "~/models/order.model";
import { connectDB } from "~/libs/db";
import { Brand } from "~/models/brand.model";
import { User } from "~/models/user.model";
import Header from "~/components/dashboard/Header";
const useBrands = routeLoader$(async ({ sharedMap }) => {
    const user = sharedMap.get("user");
    await connectDB();
    return await Brand.find({}).lean();
})

const GetOrdersAndPartners = server$(async function (brandId: string, timeRangeType: string, startDate: string, endDate: string, sortBy: string = 'revenue-desc') {
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

    let startOrderDate = '';
    let endOrderDate = '';

    if (timeRangeType == 'custom') {
        startOrderDate = startDate;
        endOrderDate = endDate;
    } else if (timeRangeType == 'today') {
        startOrderDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        endOrderDate = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
    } else if (timeRangeType == 'week') {
        startOrderDate = new Date(new Date().setHours(0, 0, 0, 0) - ((new Date().getDay() || 7) - 1) * 86400000).toISOString();
        endOrderDate = new Date(new Date(startOrderDate).getTime() + 7 * 86400000 - 1).toISOString();
    } else if (timeRangeType == 'month') {
        startOrderDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        endOrderDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    } else if (timeRangeType == 'quarter') {
        startOrderDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString();
        endOrderDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999).toISOString();
    } else if (timeRangeType == 'year') {
        startOrderDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
        endOrderDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
    }

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

    if (startOrderDate && endOrderDate) {
        matchQuery = {
            $and: [
                matchQuery,
                { orderDate: { $gte: new Date(startOrderDate), $lte: new Date(endOrderDate) } }
            ]
        };
    }
    // assign permissions

    const pipeline: any[] = [
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
    ];

    // Apply sorting stage according to sortBy
    let sortStage: any = {};
    if (sortBy === 'revenue-asc') sortStage = { totalNetValue: 1 };
    else if (sortBy === 'revenue-desc') sortStage = { totalNetValue: -1 };
    else if (sortBy === 'orders-asc') sortStage = { orderCount: 1 };
    else if (sortBy === 'orders-desc') sortStage = { orderCount: -1 };

    if (Object.keys(sortStage).length) {
        pipeline.push({ $sort: sortStage });
    }

    return await Order.aggregate(pipeline);

})

export default component$(() => {

    const nav = useNavigate();

    const brands = useBrands();
    const filter = useStore({ brand: 'all', timeRangeType: 'today', startDate: '', endDate: '', sortBy: 'revenue-desc' });
    const orderPartners = useSignal<any[]>([]);
    const currentPage = useSignal(1);
    const pageSize = useSignal(5);
    useTask$(async ({ track }) => {
        track(() => [filter.brand, filter.timeRangeType, filter.startDate, filter.endDate, filter.sortBy]);
        currentPage.value = 1;
        const orders = await GetOrdersAndPartners(filter.brand, filter.timeRangeType, filter.startDate, filter.endDate, filter.sortBy)
        orderPartners.value = orders as any[];
        // console.log("Orders by Partners:", JSON.stringify(orders, null, 2));
    });

    const totalPartners = orderPartners.value.length;
    const totalPages = Math.max(1, Math.ceil(totalPartners / pageSize.value));
    const safeCurrentPage = Math.min(currentPage.value, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize.value;
    const paginatedPartners = orderPartners.value.slice(startIndex, startIndex + pageSize.value);
    const startItem = totalPartners === 0 ? 0 : startIndex + 1;
    const endItem = Math.min(startIndex + pageSize.value, totalPartners);

    return (
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LuUsers class="w-6 h-6 text-indigo-600" />
                        Chi Tiết Khách Hàng
                    </h1>
                </div>

                <Header brands={brands.value || []} filter={filter} />
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Đối Tác</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kênh</th>
                            <th
                                class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                                onClick$={() => { filter.sortBy = filter.sortBy === 'revenue-desc' ? 'revenue-asc' : 'revenue-desc'; }}
                            >
                                Doanh Thu
                                <span class="ml-2">{filter.sortBy?.startsWith('revenue') ? (filter.sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                            </th>
                            <th
                                class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                                onClick$={() => { filter.sortBy = filter.sortBy === 'orders-desc' ? 'orders-asc' : 'orders-desc'; }}
                            >
                                Số Đơn
                                <span class="ml-2">{filter.sortBy?.startsWith('orders') ? (filter.sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                            </th>
                            <th class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {paginatedPartners.map((partnerData: any) => (
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
                        {paginatedPartners.length === 0 && (
                            <tr>
                                <td colSpan={5} class="px-6 py-10 text-center text-sm text-gray-500">
                                    Không có đối tác nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div class="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="flex items-center gap-2">
                            <span>Hiển thị</span>
                            <select
                                value={pageSize.value}
                                class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
                                onChange$={(e) => {
                                    pageSize.value = Number((e.target as HTMLSelectElement).value);
                                    currentPage.value = 1;
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                            <span>đối tác / trang</span>
                        </div>
                        <div>
                            {startItem}-{endItem} / {totalPartners} đối tác
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={safeCurrentPage <= 1}
                            onClick$={() => currentPage.value = safeCurrentPage - 1}
                        >
                            <LuChevronLeft class="h-4 w-4" />
                            Trước
                        </button>
                        <span class="min-w-[96px] text-center font-medium text-gray-700">
                            Trang {safeCurrentPage}/{totalPages}
                        </span>
                        <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={safeCurrentPage >= totalPages}
                            onClick$={() => currentPage.value = safeCurrentPage + 1}
                        >
                            Sau
                            <LuChevronRight class="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
})
