import { component$, useSignal, $ } from "@builder.io/qwik";
import { server$, useNavigate } from "@builder.io/qwik-city";
import { LuTarget as Target, LuTrash as Trash } from '@qwikest/icons/lucide'
import { EnumKPIType, InterfaceUser, InterfaceBrand, InterfaceChannel, InterfacePartner, InterfaceKPI } from "~/types/common";
import { addKPI, deleteKPI } from "~/services/kpi.service";
import { Channel } from "~/models/channel.model";
interface Props {
    channels: InterfaceChannel[]
}

const saveChannel = server$(async (name: string) => {
    const channel = new Channel({ name });
    const result = await channel.save();
    // return result;
})

const removeChannel = server$(async (channelId: string) => {
    const result = await Channel.deleteOne({ _id: channelId });
    // return result;
})

export default component$(({ channels }: Props) => {
    const nav = useNavigate()
    const channelData = useSignal("");
    const handleSaveChannel = $(async () => {
        // console.log('Saving Channel:', channelData.value);
        await saveChannel(channelData.value);
        await nav()
    })
    return (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit space-y-4">
                <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Target class="w-5 h-5 text-indigo-600" />Cấu Hình kênh</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên kênh</label>
                    <input type="text" value={channelData.value} onChange$={(e:any) => {channelData.value = e.target.value}} class="w-full rounded-lg border-gray-300 border p-2 font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button onClick$={handleSaveChannel} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all active:scale-95">Lưu kênh</button>

            </div>

            <div class="lg:col-span-2 space-y-4">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kênh</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Xóa</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {channels?.map(channel => (
                                <tr key={channel._id} class="hover:bg-gray-50 transition-colors">
                                    
                                    <td class="px-6 py-4 text-sm text-gray-600">{channel.name}</td>
                                    {/* <td class="px-6 py-4 text-sm font-bold text-indigo-600 text-right">{channel.amount}</td> */}
                                    <td class="px-6 py-4 text-center"><button onClick$={async () => {await removeChannel(channel._id); await nav()}} class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Trash class="w-4 h-4"/></button></td>
                                </tr>
                            ))}
                            {channels.length == 0 && <tr><td colSpan={4} class="p-8 text-center text-gray-400 italic">Chưa có kênh nào được thiết lập</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
})