import { component$, $ } from '@builder.io/qwik';
import { LuUsers as Users, LuBuilding as Building, LuTarget as Target, LuShield as Shield } from '@qwikest/icons/lucide';
// import { $ } from '@builder.io/qwik';
interface Props {
    activeTab: any
}
export default component$(({activeTab} : Props) => {
    return (
        <div class="flex border-b border-gray-200 bg-white px-4 rounded-t-xl overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'users', label: 'NHÂN SỰ & QUYỀN', icon: $(Users) } as any,
                            { id: 'partners', label: 'QUẢN LÝ ĐỐI TÁC', icon: $(Building) } as any,
                            { id: 'kpis', label: 'THIẾT LẬP KPI', icon: $(Target) } as any,
                            { id: 'brands', label: 'QUẢN LÝ THƯƠNG HIỆU', icon: $(Shield) } as any,
                            { id: 'channels', label: 'QUẢN LÝ KÊNH BÁN HÀNG', icon: $(Building) } as any,
                        ].map(tab => (
                            <button
                            key={tab.id}
                            class={`px-6 py-4 font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab.value == tab.id ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick$={() => activeTab.value = tab.id}
                            >
                                {/* <tab.icon className="w-4 h-4" /> */}
                                {tab.label}
                            </button>
                        ))}
                    </div>
    )
});