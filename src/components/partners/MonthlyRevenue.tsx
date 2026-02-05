import { component$, useSignal } from "@builder.io/qwik";
import { LuCalendar } from "@qwikest/icons/lucide";

interface Props {
    orders: any[]
}
export default component$(({ orders }: Props) => {
    const order12Months = orders.sort((a, b) => {
        const [monthA, yearA] = a.monthYear.split('-').map(Number);
        const [monthB, yearB] = b.monthYear.split('-').map(Number);
        if (yearA === yearB) {
            return monthA - monthB;
        }
        return yearA - yearB;
        // return [/]
    })
    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <LuCalendar class="w-5 h-5 text-indigo-600" />
                    Doanh Số 12 Tháng Gần Nhất
                </h3>
            </div>
            <div class="overflow-x-auto max-h-[300px]">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tháng/Năm</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số Đơn</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh Thu (Trước CK)</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh Thu (Sau CK)</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sau thuế</th>
                            
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {order12Months.map((order) => (
                            <tr key={order.monthYear}>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{order.monthYear}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{order.totalOrders}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalListValue!)}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalNetValue!)}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalGrossValue!)}</td>
                            </tr>
                        ))}
                        {order12Months.length === 0 && (
                            <tr><td colSpan={5} class="text-center py-6 text-gray-500">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})