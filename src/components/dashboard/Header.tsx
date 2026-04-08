import { component$, useSignal } from "@builder.io/qwik";

import { LuCalendar, LuDownload, LuFilter } from "@qwikest/icons/lucide";

interface Props {
    brands: any[];
    filter: {brand: string, timeRangeType: string, startDate?: string, endDate?: string};
}

export default component$(({ brands, filter }: Props) => {
    // const range = useSignal("today");
    return (
        <div class="flex flex-col md:flex-row gap-3">
            <div class="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center gap-2">
                    <LuFilter class="w-4 h-4 text-gray-500" />
                    <select value={filter.brand} onClick$={(e) => filter.brand = (e.target as HTMLSelectElement).value} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2">
                        <option value="all">Tất cả thương hiệu</option>
                        {brands.map((brand) => (
                            <option value={brand._id} key={brand._id}>{brand.name}</option>
                        ))}
                    </select>
                </div>
                <div class="h-full w-px bg-gray-200 hidden md:block"></div>
                <div class="flex items-center gap-2">
                    <LuCalendar class="w-4 h-4 text-gray-500" />
                    <select value={filter.timeRangeType} onClick$={(e) => filter.timeRangeType = (e.target as HTMLSelectElement).value} name="timeRange" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2">
                        <option value="today">Hôm nay</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="quarter">Quý này</option>
                        <option value="year">Năm nay</option>
                        <option value="custom">Tùy chỉnh</option>
                    </select>
                </div>
                { filter.timeRangeType === "custom" && (
                    <div class="flex gap-2">
                        <input type="date" value={filter.startDate} onChange$={(e) => filter.startDate = (e.target as HTMLInputElement).value} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2" />
                        <span class="self-center">-</span>
                        <input type="date" value={filter.endDate} onChange$={(e) => filter.endDate = (e.target as HTMLInputElement).value} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2" />
                    </div>
                )}
            </div>

            <button class="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap">
                <LuDownload class="w-5 h-5" /> Xuất Dữ Liệu
            </button>
        </div>
    )
})