import { component$, useSignal } from "@builder.io/qwik";
import { LuDollarSign as DollarSign, LuShoppingCart, LuTarget } from "@qwikest/icons/lucide";

interface Props {
    stats: any,
    currentUser: any,
    kpis: any
}

export default component$(({ stats, currentUser, kpis }: Props) => {
    // console.log("Metrics Component KPIs:", JSON.stringify(stats, null, 2));
    return (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-gray-500 text-xs font-bold uppercase">Doanh thu (Trước CK)</h3>
                    <div class="p-1.5 bg-gray-100 rounded-lg">
                        <DollarSign class="w-4 h-4 text-gray-600" />
                    </div>
                </div>
                <p class="text-xl font-bold text-gray-900 truncate" title={new Intl.NumberFormat('vi-VN').format(stats?.totalListValue!)}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalListValue!)}
                </p>
            </div>

            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 bg-indigo-50 border-indigo-100">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-indigo-800 text-xs font-bold uppercase">Doanh thu (Sau CK)</h3>
                    <div class="p-1.5 bg-white bg-opacity-50 rounded-lg">
                        <DollarSign class="w-4 h-4 text-indigo-600" />
                    </div>
                </div>
                <p class="text-xl font-bold text-indigo-700 truncate" title={new Intl.NumberFormat('vi-VN').format(stats?.totalNetValue)}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalNetValue)}
                </p>
            </div>

            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 bg-indigo-50 border-indigo-100">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-indigo-800 text-xs font-bold uppercase">Sau thuế</h3>
                    <div class="p-1.5 bg-white bg-opacity-50 rounded-lg">
                        <DollarSign class="w-4 h-4 text-indigo-600" />
                    </div>
                </div>
                <p class="text-xl font-bold text-indigo-700 truncate" title={new Intl.NumberFormat('vi-VN').format(stats?.totalGrossValue)}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalGrossValue)}
                </p>
            </div>

            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-gray-500 text-xs font-bold uppercase">Số lượng đơn hàng</h3>
                    <div class="p-1.5 bg-gray-100 rounded-lg">
                        <LuShoppingCart class="w-4 h-4 text-gray-600" />
                    </div>
                </div>
                <p class="text-xl font-bold text-gray-900 truncate" title={new Intl.NumberFormat('vi-VN').format(stats?.totalOrders!)}>
                    {new Intl.NumberFormat('vi-VN').format(stats?.totalOrders!)}
                </p>
            </div>
            
        </div>
    )
})