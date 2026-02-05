import { component$, useSignal } from "@builder.io/qwik";
import { LuCalendar } from "@qwikest/icons/lucide";

interface Props {
    kpis: { month: any[], quarter: any[], year: any[] }
}
export default component$(({ kpis }: Props) => {
    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <LuCalendar class="w-5 h-5 text-indigo-600" />
                    Danh sách KPIs
                </h3>
            </div>
            <div class="overflow-x-auto max-h-[300px]">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thời hạn</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mục tiêu</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hiện tại</th>
                            
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {kpis.month.map((kpi) => (
                            <tr key={kpi.monthYear}>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{kpi.period}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{kpi.timeframe}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(kpi.amount)}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'percent' }).format(kpi.process)}</td>
                            </tr>
                        ))}
                        {kpis.quarter.map((kpi) => (
                            <tr key={kpi.monthYear}>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{kpi.period}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{kpi.timeframe}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(kpi.amount)}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'percent' }).format(kpi.process)}</td>
                            </tr>
                        ))}
                        {kpis.year.map((kpi) => (
                            <tr key={kpi.monthYear}>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{kpi.period}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{kpi.timeframe}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(kpi.amount)}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('vi-VN', { style: 'percent' }).format(kpi.process)}</td>
                            </tr>
                        ))}
                        {kpis.month.length === 0 && kpis.quarter.length === 0 && kpis.year.length === 0 && (
                            <tr><td colSpan={5} class="text-center py-6 text-gray-500">Có lỗi xảy ra, liên hệ Thanh Định để có thêm kpi</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})