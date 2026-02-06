import { component$ } from '@builder.io/qwik';
interface Props {
    partners: any[]
}
export default component$(({ partners }: Props) => {
    return (
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối tác</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng đơn</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                    </tr>
                </thead>    
                <tbody class="bg-white divide-y divide-gray-200">
                    {partners.map((partner, index) => (
                        <tr key={index} class="hover:bg-gray-50">
                            <td class="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                            <td class="px-6 py-3 text-sm font-medium text-gray-900">{partner.partnerName}</td>
                            <td class="px-6 py-3 text-sm text-gray-500">{partner.totalOrders}</td>
                            <td class="px-6 py-3 text-sm font-medium text-gray-900">{partner.totalQty}</td>
                            <td class="px-6 py-3 text-sm text-gray-500 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(partner.totalNetRevenue)}</td>
                        </tr>
                    ))}
                    {partners.length === 0 && (
                        <tr><td colSpan={5} class="px-6 py-3 text-center text-sm text-gray-500">No partners found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
})