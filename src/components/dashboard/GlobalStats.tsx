import { component$ } from "@builder.io/qwik";
import KPICard from "./KPICard";
import { LuDollarSign } from "@qwikest/icons/lucide";
interface Props {
    stats: any;
}

export default component$(({ stats }: Props) => {
    console.log("stats in global stats", stats);

    return (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="TỔNG DOANH THU" value={stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalNetRevenue) : '₫0'} isPrimary={true} />
            <KPICard title="TRƯỚC CHIẾT KHẤU" value={stats ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalListRevenue) : '₫0'} isPrimary={false} colorClass="bg-indigo-500"/>

            <div class="md:col-span-2 lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-center">
                <div class="flex items-center gap-8 w-full justify-around">
                    <div class="text-center flex-1">
                        <h3 class="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Đơn hàng</h3>
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-bold text-gray-800">{stats.totalOrders}</span>
                        </div>
                    </div>

                    <div class="h-16 w-px bg-gray-200"></div>

                    <div class="text-center flex-1">
                        <h3 class="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Đối tác</h3>
                        <div class="flex flex-col items-center">
                            <span class="text-3xl font-bold text-gray-800">{stats.totalPartners}</span>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}) 