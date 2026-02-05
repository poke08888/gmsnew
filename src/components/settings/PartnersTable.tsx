import { LuBuilding as Building, LuPlusCircle as PlusCircle, LuPencil as Edit, LuTrash2 as Trash2, LuMapPin as MapPin, LuFileText as FileText } from '@qwikest/icons/lucide';
import { component$, useSignal, $, JSXChildren, JSXNode, Signal } from '@builder.io/qwik';
import { InterfacePartner } from '~/types/common';
import { server$, useNavigate } from '@builder.io/qwik-city';
import { deletePartner as deletePartnerService } from '~/services/partner.service';
interface Props {
    modalPartnerData: {value: { open: boolean; partner: any }};
    partners: InterfacePartner[]
}

const deletePartner = server$(async (partnerId: string) => {
    await deletePartnerService(partnerId);
})

export default component$(({ modalPartnerData, partners }: Props) => {
    const nav = useNavigate();
    return (
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><Building class="w-5 h-5 text-indigo-600" />Danh Sách Đối Tác</h3>
                <button onClick$={() => {
                    modalPartnerData.value = { open: true, partner: null };
                }} class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all active:scale-95">
                    <PlusCircle class="w-4 h-4" /> Thêm Đối Tác
                </button>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đối tác</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kênh</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {partners?.map((partner:InterfacePartner) => (
                            <tr key={partner._id} class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-sm font-bold text-gray-900">{partner.name || ""}</td>
                                <td class="px-6 py-4 text-sm font-medium text-blue-600">{partner.channelId?.name}</td>
                                <td class="px-6 py-4">
                                    <div class="text-[11px] text-gray-500 flex flex-col gap-1">
                                        <span class="flex items-center gap-1"><MapPin class="w-3 h-3" /> {partner.warehouses.length} kho/điểm giao</span>
                                        <span class="flex items-center gap-1"><FileText class="w-3 h-3" /> {partner.billings.length} đơn vị HĐ</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right space-x-2">
                                    <button onClick$={async () => {modalPartnerData.value = {open: true, partner: partner}; await nav()}} class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit class="w-4 h-4" /></button>
                                    <button onClick$={async () => {
                                        await deletePartner(partner._id);
                                        await nav();
                                    }} class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                        {partners.length == 0 && (
                            <tr>
                                <td colSpan={4} class="p-8 text-center text-gray-500 italic">Chưa có đối tác nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})