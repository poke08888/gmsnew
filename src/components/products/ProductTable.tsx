import { component$ } from "@builder.io/qwik";
import { LuChevronLeft, LuChevronRight } from "@qwikest/icons/lucide";
interface Props {
    products: any[],
    onOpenProductDetail: { isOpen: boolean, product: any },
    currentPage: number,
    pageSize: number,
    onPageChange$: (page: number) => void,
    onPageSizeChange$: (size: number) => void,
    sortBy?: string,
    onSortChange$?: (sortBy: string) => void,
}
export default component$(({ products, onOpenProductDetail, currentPage, pageSize, onPageChange$, onPageSizeChange$, sortBy, onSortChange$ }: Props) => {
    const totalProducts = products.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const paginatedProducts = products.slice(startIndex, startIndex + pageSize);
    const startItem = totalProducts === 0 ? 0 : startIndex + 1;
    const endItem = Math.min(startIndex + pageSize, totalProducts);

    return (
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Sản Phẩm</th>
                            <th
                                class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                                onClick$={() => onSortChange$ && onSortChange$((sortBy === 'qty-desc') ? 'qty-asc' : 'qty-desc')}
                            >
                                Số Lượng Bán
                                <span class="ml-2">{sortBy?.startsWith('qty') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                            </th>
                            <th
                                class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                                onClick$={() => onSortChange$ && onSortChange$((sortBy === 'revenue-desc') ? 'revenue-asc' : 'revenue-desc')}
                            >
                                Doanh Thu (Sau CK)
                                <span class="ml-2">{sortBy?.startsWith('revenue') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                            </th>
                            <th
                                class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                                onClick$={() => onSortChange$ && onSortChange$((sortBy === 'orders-desc') ? 'orders-asc' : 'orders-desc')}
                            >
                                Số Lần Xuất Hiện
                                <span class="ml-2">{sortBy?.startsWith('orders') ? (sortBy?.endsWith('desc') ? '▼' : '▲') : ''}</span>
                            </th>
                            <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi Tiết</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {paginatedProducts.map((product: any) => (
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
                        {paginatedProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} class="px-6 py-10 text-center text-sm text-gray-500">
                                    Không có sản phẩm nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div class="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div class="flex items-center gap-2">
                        <span>Hiển thị</span>
                        <select
                            value={pageSize}
                            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
                            onChange$={(e) => onPageSizeChange$(Number((e.target as HTMLSelectElement).value))}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={100}>100</option>
                        </select>
                        <span>sản phẩm / trang</span>
                    </div>
                    <div>
                        {startItem}-{endItem} / {totalProducts} sản phẩm
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={safeCurrentPage <= 1}
                        onClick$={() => onPageChange$(safeCurrentPage - 1)}
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
                        onClick$={() => onPageChange$(safeCurrentPage + 1)}
                    >
                        Sau
                        <LuChevronRight class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
})
