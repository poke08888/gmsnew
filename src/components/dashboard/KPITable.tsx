import { component$ } from '@builder.io/qwik';

interface Props {
    kpi: any[]
}

export default component$(({ kpi }: Props) => {

    return (
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chu kỳ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mục tiêu</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Tiến độ</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {kpi.map((item, index) => {
                        return (
                            <tr key={index} class="hover:bg-gray-50">
                                <td class="px-6 py-3 text-sm text-gray-500">{item.type}</td>
                                <td class="px-6 py-3 text-sm text-gray-500">{item.period}</td>
                                <td class="px-6 py-3 text-sm text-gray-500">{new Date(item.timeframe).toLocaleDateString()}</td>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                <td class="px-6 py-3 text-sm text-gray-500 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</td>
                                <td class="px-6 py-3 text-sm font-bold text-indigo-600 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.currentValue || 0)}</td>
                                <td class="px-6 py-3 w-1/3">
                                    <div class="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            class="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-in-out"
                                            style={{ width: `${item.progress}%` }}
                                        ></div>
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">{item.progress.toFixed(2)}%</div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
})