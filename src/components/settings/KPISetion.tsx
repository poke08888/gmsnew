import { component$, useSignal, $ } from "@builder.io/qwik";
import { server$, useNavigate } from "@builder.io/qwik-city";
import { LuTarget as Target, LuTrash as Trash } from '@qwikest/icons/lucide'
import { EnumKPIType, InterfaceUser, InterfaceBrand, InterfaceChannel, InterfacePartner, InterfaceKPI, EnumUserCustomPermission, EnumUserRole } from "~/types/common";

import { addKPI, deleteKPI } from "~/services/kpi.service";
import { verifyJWT } from "~/services/hash.service";

interface Props {
    users: InterfaceUser[],
    partners: InterfacePartner[],
    channels: InterfaceChannel[],
    kpis: InterfaceKPI[]
}

const saveKPI = server$(async function(type: EnumKPIType, targetId: string, period: string, timeframe: string, amount: number) {

    const auth_token = this.cookie.get('auth_token')?.value;
    if (!auth_token) {
        return false;
    }

    const isValid = await verifyJWT(auth_token);
    if (!isValid) {
        return false;
    }

    if (isValid.role != EnumUserRole.DIRECTOR && !isValid.customPermissions.includes(EnumUserCustomPermission.MANAGE_KPIS)) return false;

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(timeframe)) return false;
    const inputInt = parseInt(timeframe.replace('-', ''), 10);
    const now = new Date();
    const currentInt = now.getFullYear() * 100 + (now.getMonth() + 1);
    if (inputInt < currentInt) return false;
    const [year, month] = timeframe.split('-').map(Number);
    let endTime;
    // console.log('Period:', period);
    switch (period) {
        case 'MONTH':
            endTime = `${year}-${month}`
            break;
        case 'QUARTER':
            endTime = `${year}-${Math.ceil(month / 3) * 3}`
            break;
        case 'YEAR':
            endTime = `${year}-12`
            break;
        default:
            endTime = `${year}-12`
            break;
    }
    
    const result = await addKPI(type, targetId, period, endTime, amount);
    // return result;
})

const removeKPI = server$(async function(kpiId: string) {
    const auth_token = this.cookie.get('auth_token')?.value;
    if (!auth_token) {
        return false;
    }

    const isValid = await verifyJWT(auth_token);
    if (!isValid) {
        return false;
    }

    if (isValid.role != EnumUserRole.DIRECTOR && !isValid.customPermissions.includes(EnumUserCustomPermission.MANAGE_KPIS)) return false;
    const result = await deleteKPI(kpiId);
    // return result;
})

export default component$(({ users, partners, channels, kpis }: Props) => {
    const nav = useNavigate()
    const KPIData = useSignal({type: EnumKPIType.CHANNEL, targetId: '', period: '', timeframe: '', amount: 0});
    const handleSaveKPI = $(async () => {
        console.log('Saving KPI:', KPIData.value);
        await saveKPI(KPIData.value.type, KPIData.value.targetId, KPIData.value.period, KPIData.value.timeframe, KPIData.value.amount);
        await nav()
    })
    return (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit space-y-4">
                <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Target class="w-5 h-5 text-indigo-600" />Cấu Hình KPI</h3>
                <div>
                     <label class="block text-sm font-medium text-gray-700 mb-1">Đối tượng áp dụng</label>
                     <select value={KPIData.value.type} onChange$={(e: any) => {KPIData.value = {targetId: '', type: e.target.value as EnumKPIType, period: '', timeframe: '', amount: 0}}} class="w-full rounded-lg border-gray-300 border p-2 outline-none">
                        <option value={EnumKPIType.CHANNEL}>Theo Kênh</option>
                        <option value={EnumKPIType.USER}>Theo Nhân Viên</option>
                        <option value={EnumKPIType.PARTNER}>Theo Đối Tác</option>
                     </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Chọn đối tượng cụ thể</label>
                    <select value={KPIData.value.targetId} onChange$={(e: any) => {KPIData.value = {...KPIData.value, targetId: e.target.value}}} class="w-full rounded-lg border-gray-300 border p-2 outline-none">
                        {KPIData.value.type == EnumKPIType.CHANNEL && channels.map(channel => <option key={channel._id} value={channel._id}>{channel.name}</option>)}
                        {KPIData.value.type == EnumKPIType.USER && users.map(user => <option key={user._id} value={user._id}>{user.name}({user.role})</option>)}
                        {KPIData.value.type == EnumKPIType.PARTNER && partners.map(partner => <option key={partner._id} value={partner._id}>{partner.name}</option>)}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Chu kỳ</label>
                        <select value={KPIData.value.period} onChange$={(e:any) => {KPIData.value = {...KPIData.value, period: e.target.value}}} class="w-full rounded-lg border-gray-300 border p-2 outline-none">
                            <option value="MONTH">Tháng</option>
                            <option value="QUARTER">Quý</option>
                            <option value="YEAR">Năm</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                        <input type="text" value={KPIData.value.timeframe} onChange$={(e:any) => {KPIData.value = {...KPIData.value, timeframe: e.target.value}}} class="w-full rounded-lg border-gray-300 border p-2 outline-none" placeholder="2025-01" />
                    </div>
                    
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Số tiền mục tiêu (VND)</label>
                    <input type="number" value={KPIData.value.amount} onChange$={(e:any) => {KPIData.value = {...KPIData.value, amount: Number(e.target.value)}}} class="w-full rounded-lg border-gray-300 border p-2 font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button onClick$={handleSaveKPI} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all active:scale-95">Lưu KPI</button>

            </div>

            <div class="lg:col-span-2 space-y-4">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đối tượng</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kỳ</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Mục tiêu</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Xóa</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {kpis.map(kpi => (
                                <tr key={kpi._id} class="hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-bold text-gray-900">
                                            {kpi.type == EnumKPIType.CHANNEL && channels.find(c => c._id == kpi.targetId)?.name}
                                            {kpi.type == EnumKPIType.USER && users.find(c => c._id == kpi.targetId)?.name}
                                            {kpi.type == EnumKPIType.PARTNER && partners.find(c => c._id == kpi.targetId)?.name}
                                        </div>
                                        <div class="text-[10px] text-gray-400 uppercase tracking-tight">Loại: {kpi.type}</div>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600">{kpi.timeframe} ({kpi.period})</td>
                                    <td class="px-6 py-4 text-sm font-bold text-indigo-600 text-right">{kpi.amount}</td>
                                    <td class="px-6 py-4 text-center"><button onClick$={async () => {await removeKPI(kpi._id); await nav()}} class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Trash class="w-4 h-4"/></button></td>
                                </tr>
                            ))}
                            {kpis.length == 0 && <tr><td colSpan={4} class="p-8 text-center text-gray-400 italic">Chưa có KPI nào được thiết lập</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
})