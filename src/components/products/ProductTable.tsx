import { component$ } from "@builder.io/qwik";
import { LuChevronRight } from "@qwikest/icons/lucide";
interface Props {
    products: any[],
    onOpenProductDetail: { isOpen: boolean, product: any }
}
export default component$(({ products, onOpenProductDetail }: Props) => {
    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Sản Phẩm</th>
                            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lượng Bán</th>
                            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh Thu (Sau CK)</th>
                            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lần Xuất Hiện</th>
                            <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi Tiết</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {products.map((product: any, index: number) => (
                            <tr
                                onClick$={() => {onOpenProductDetail.isOpen = true; onOpenProductDetail.product = product}}
                                class="hover:bg-indigo-50 cursor-pointer transition-colors"
                            >
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{product.sku}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-bold text-gray-900">{product.name}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                                    {product.totalQty.toLocaleString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalNetRevenue)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{product.totalOrders}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
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