import { component$ } from "@builder.io/qwik";
import { LuArrowUpDown, LuCalendar, LuFilter, LuX } from "@qwikest/icons/lucide";

interface Props {
    filterBar: any,
    brands: any[]
}

export default component$(({ filterBar, brands }: Props) => {
    return (
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2 text-sm text-gray-700">
                <LuFilter class="w-4 h-4 text-gray-400" />
                <span class="font-medium">Thương hiệu:</span>
                <select value={filterBar.brand} onChange$={(e) => filterBar.brand = (e.target as HTMLSelectElement).value}
                    class="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-indigo-500 outline-none"    
                >
                    <option value="all">Tất cả</option>
                    {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                    
                </select>
            </div>

            <div class="flex items-center gap-2 text-sm text-gray-700">
                <LuCalendar class="w-4 h-4 text-gray-400" />
                <span class="font-medium">Từ ngày:</span>
                <input 
                    type="date"
                    class="px-3 py-1.5 rounded-lg border border-gray-300 outline-none"
                    value={filterBar.startDate}
                    onChange$={(e) => filterBar.startDate = (e.target as HTMLInputElement).value}
                />
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-700">
                {/* <LuCalendar class="w-4 h-4 text-gray-400" /> */}
                <span class="font-medium">Đến ngày:</span>
                <input 
                    type="date"
                    class="px-3 py-1.5 rounded-lg border border-gray-300 outline-none"
                    value={filterBar.endDate}
                    onChange$={(e) => filterBar.endDate = (e.target as HTMLInputElement).value}
                />
            </div>

            <div class="flex items-center gap-2 text-sm text-gray-700">
                <LuArrowUpDown class="w-4 h-4 text-gray-400" />
                <span class="font-medium">Sắp xếp:</span>
                <select
                    class="px-3 py-1.5 rounded-lg border border-gray-300 outline-none"
                    value={filterBar.sortBy}
                    onChange$={(e) => filterBar.sortBy = (e.target as HTMLInputElement).value}
                >
                    <option value="revenue-desc">Doanh thu cao nhất</option>
                    <option value="qty-desc">Số lượng bán nhiều nhất</option>
                </select>
            </div>

            <button
                onClick$={() => {filterBar.brand = 'all'; filterBar.startDate = ''; filterBar.endDate = ''; filterBar.sortBy = 'revenue-desc'}}
                class="ml-auto text-gray-500 hover:text-red-600 text-sm flex items-center gap-1 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
            >
                <LuX class="w-4 h-4" />Xóa lọc
            </button>

        </div>
    )
})