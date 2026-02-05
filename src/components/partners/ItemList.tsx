import { component$, useResource$ } from "@builder.io/qwik";

import { LuPackage } from "@qwikest/icons/lucide";

interface Props {
    items: any[];
}

export default component$(({ items }: Props) => {
    // console.log("Items List:", JSON.stringify(items, null, 2));
    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <LuPackage class="w-5 h-5 text-indigo-600" />
                    Danh Sách Sản Phẩm (SKU)
                </h3>
            </div>
            <div class="overflow-auto max-h-[400px]">
               <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr class="bg-gray-50 sticky top-0">
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {items.map((item: any, index: number) => (
                            <tr key={item.sku}>
                                <td class="px-6 py-3 text-sm font-medium text-gray-900">{index + 1}. {item.productName}</td>
                                <td class="px-6 py-3 text-sm text-gray-700 text-right">{item.totalQty.toLocaleString()}</td>
                                <td class="px-6 py-3 text-sm text-indigo-600 font-bold text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalNetPrice)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={3} class="text-center py-6 text-gray-500">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table> 
            </div>
        </div>
    )
})