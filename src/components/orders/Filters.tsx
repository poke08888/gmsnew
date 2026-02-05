import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import { InterfaceChannel, InterfacePartner, InterfaceUser } from '~/types/common';
import { LuSearch as Search } from '@qwikest/icons/lucide';
import { useNavigate } from '@builder.io/qwik-city';
interface Props {
    search: { text: string, partnerId: string, userId: string, startDate: string, endDate: string },
    // channels: InterfaceChannel[],
    partners: InterfacePartner[],
    users: InterfaceUser[]
}

export default component$(({search, partners, users}: Props) => {
    const nav = useNavigate()

    const inputText = useSignal('');
    useTask$(({track, cleanup}) => {
        track(() => inputText.value);

        const id = setTimeout(() => {
            search.text = inputText.value;
            // console.log('Search text updated:', search);
        }, 800);
        cleanup(() => clearTimeout(id));
})

    return (
        <div class="p-4 border-b border-gray-100 bg-gray-50 space-y-4">
            <div class="flex flex-wrap gap-4">
                <div class="relative flex-1 min-w-[200px]">
                    <input type="text" placeholder="Tìm mã đơn / khách hàng..." bind:value={inputText} class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <Search class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>

                <select value={search.partnerId} onChange$={(e) => search.partnerId = (e.target as HTMLSelectElement).value} class="px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    <option value="all">Tất cả đối tác</option>
                    {partners.map(partner => (
                        <option value={partner._id}>{partner.name}</option>
                    ))}
                </select>
                <select value={search.userId} onChange$={(e) => search.userId = (e.target as HTMLSelectElement).value} class="px-3 py-2 rounded-lg border border-gray-300 bg-white">
                    <option value="all">Tất cả người dùng</option>
                    {users.map(user => (
                        <option value={user._id}>{user.name}</option>
                    ))}
                </select>
                <div class="flex items-center gap-2">
                    <input type="date" value={search.startDate} onChange$={(e) => search.startDate = (e.target as HTMLInputElement).value} class="px-3 py-1.5 rounded-lg border border-gray-300 outline-none" />
                    <input type="date" value={search.endDate} onChange$={(e) => search.endDate = (e.target as HTMLInputElement).value} class="px-3 py-1.5 rounded-lg border border-gray-300 outline-none" />
                </div>
            </div>
        </div>
    )
})