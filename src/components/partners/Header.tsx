import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { LuCalendar } from "@qwikest/icons/lucide";

interface Props {
    partner: any,
    timeRange: any
}
export default component$(({ partner, timeRange }: Props) => {
    const loc = useLocation()
    const nav = useNavigate()
    
    return (
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">{partner?.partnerName}</h1>
                <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md mt-2 inline-block">
                Kênh: {partner?.channelName}
                </span>
            </div>

            <div class="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                <LuCalendar class="w-4 h-4 text-gray-500" />
                 <select onChange$={async () => {let path = loc.url.pathname; await nav(path + `?timeRange=${timeRange.value}`)}} class="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 outline-none cursor-pointer" bind:value={timeRange}>
                    <option value="month">Tháng này</option>
                    <option value="quarter">Quý này</option>
                    <option value="year">Năm nay</option>
                    <option value="all">Tất cả</option>
                 </select>
            </div>
        </div>
    )
}) 