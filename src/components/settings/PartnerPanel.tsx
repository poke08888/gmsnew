import {component$, useSignal, $} from '@builder.io/qwik';
import { model } from 'mongoose';
import { LuX as X, LuMapPin as MapPin, LuPlus as Plus, LuMinusCircle as MinusCircle, LuFileText as FileText, LuCheckCircle as CheckCircle } from '@qwikest/icons/lucide';
import { Channel } from '~/models/channel.model';
import { InterfaceBilling, InterfaceChannel, InterfaceWarehouse } from '~/types/common';
import { server$, useNavigate } from '@builder.io/qwik-city';
import { verifyJWT } from '~/services/hash.service';
import { CreateOrUpdateBilling } from '~/services/billing.service';
import { CreateOrUpdateWarehouse } from '~/services/warehouse.service';
import { CreateOrUpdatePartner } from '~/services/partner.service';
import { cp } from 'fs';
interface Props {
    modalPartnerData: any;
    channels: InterfaceChannel[];
}

const addPartner = server$(async function (partnerData: any) {
    const auth = this.cookie.get('auth_token')?.value || '';
    
    const isAuth = await verifyJWT(auth);
    if (!isAuth) {
        return { success: false, error: 'Unauthorized' };
    }
    let billings = partnerData.billings || [];
    let warehouses  = partnerData.warehouses || [];
    if (billings.length) {
        const _billings: any = [];
        for (let billing of billings) {
            let result = await CreateOrUpdateBilling(billing);
            _billings.push(result);
        }
        partnerData.billings = _billings;
        // console.log('Updated billings:', _billings);
    }

    if (warehouses.length) {
        const _warehouses: any = [];
        for (let warehouse of warehouses) {
            let result = await CreateOrUpdateWarehouse(warehouse);
            _warehouses.push(result);
        }
        partnerData.warehouses = _warehouses;
        // console.log('Updated warehouses:', _warehouses);
    }
    
    await CreateOrUpdatePartner(partnerData);
    return { success: true };
})

export default component$(({modalPartnerData, channels}: Props) => {
    const nav = useNavigate()
    const handleSavePartner = $(async () => {
        const partnerData = modalPartnerData.value.partner;
        // console.log('partnerData to save:', partnerData);
        await addPartner(partnerData);

        await nav()
        modalPartnerData.value = { open: false, partner: null };
    });

    modalPartnerData.value.partner = modalPartnerData.value.partner || {};
    return (
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div class="bg-indigo-600 p-6 flex justify-between items-center text-white">
                    <h2 class="text-xl font-bold">{modalPartnerData.value.partner?.name ? 'Chỉnh sửa đối tác' : 'Thêm đối tác mới'}</h2>
                    <button onClick$={() => modalPartnerData.value = { open: false, partner: null }} class="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"><X class="w-6 h-6" /></button>
                </div>
                <div class="p-8 overflow-y-auto space-y-8 scrollbar-hide">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tên đối tác</label>
                            <input type="text" value={modalPartnerData.value.partner?.name ?? ''} onChange$={(e: any) => modalPartnerData.value.partner.name = (e.target as HTMLInputElement).value} class="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="VD: WinMart, Co.op Mart..." />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kênh phân phối</label>
                            <select value={modalPartnerData.value.partner?.channelId?._id ?? ''} onChange$={(e: any) => modalPartnerData.value.partner.channelId = (e.target as HTMLSelectElement).value} class="w-full rounded-lg border-gray-300 border p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                                {channels.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <section class="space-y-4">
                        <div class="flex justify-between items-center border-b pb-2">
                            <h4 class="text-sm font-bold text-indigo-600 flex items-center gap-2"><MapPin class="w-4 h-4" /> KHO HÀNG / ĐIỂM GIAO</h4>
                            <button onClick$={() => {
                                modalPartnerData.value = {...modalPartnerData.value, partner: {
                                    ...modalPartnerData.value.partner,
                                    warehouses: [...modalPartnerData.value.partner?.warehouses || [], { _id: '', name: '', location: '', contactName: '', contactPhone: '' }]
                                }}
                            }} class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"><Plus class="w-3 h-3" /> Thêm kho</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modalPartnerData.value.partner?.warehouses?.map((warehouse: InterfaceWarehouse) => (
                                <div key={warehouse._id} class="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                                    <button onClick$={() => {
                                        modalPartnerData.value.partner.warehouses = modalPartnerData.value.partner.warehouses.filter((w: InterfaceWarehouse) => w !== warehouse);
                                        modalPartnerData.value = {...modalPartnerData.value};
                                    }} class="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><MinusCircle class="w-4 h-4" /></button>
                                    <input value={warehouse.name} onChange$={(e:any) => {
                                        warehouse.name = (e.target as HTMLInputElement).value;
                                        modalPartnerData.value = {...modalPartnerData.value};
                                    }} type="text" class="w-full text-sm font-bold mb-2 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none" placeholder='Tên kho/điểm nhận'/>
                                    <input type="text" class="w-full text-xs mb-2 p-1.5 rounded bg-white border border-gray-200" placeholder="Địa chỉ giao hàng" value={warehouse.location} onChange$={(e:any) => {
                                        warehouse.location = (e.target as HTMLInputElement).value;
                                        modalPartnerData.value = {...modalPartnerData.value};
                                    }}/>
                                    <div class="grid grid-cols-2 gap-2">
                                        <input class="text-[11px] p-1.5 rounded bg-white border border-gray-200" placeholder="Người nhận" value={warehouse.contactName} onChange$={(e: any) => {
                                            warehouse.contactName = e.target.value;
                                            modalPartnerData.value = {...modalPartnerData.value};
                                        }}/>
                                        <input class="text-[11px] p-1.5 rounded bg-white border border-gray-200" placeholder="SĐT nhận" value={warehouse.contactPhone} onChange$={(e: any) => {
                                            warehouse.contactPhone = e.target.value;
                                            modalPartnerData.value = {...modalPartnerData.value};
                                        }}/>
                                    </div>
                                </div>
                            ))}
                            { !modalPartnerData.value.partner?.warehouses?.length && (
                                <div class="col-span-full text-center p-4 text-gray-400 text-sm italic">Bấm "Thêm kho" để cấu hình địa chỉ giao hàng</div>
                            )}
                        </div>
                    </section>

                    <section class="space-y-4">
                        <div class="flex justify-between items-center border-b pb-2">
                            <h4 class="text-sm font-bold text-indigo-600 flex items-center gap-2"><FileText class="w-4 h-4" /> THÔNG TIN XUẤT HÓA ĐƠN</h4>
                            <button onClick$={() => {
                                modalPartnerData.value = {...modalPartnerData.value, partner: {
                                    ...modalPartnerData.value.partner,
                                    billings: [...modalPartnerData.value.partner?.billings || [], { _id: '', name: '', location: '', taxNumber: '' }]
                                }}
                            }} class="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors"><Plus class="w-3 h-3" /> Thêm đơn vị</button>
                        </div>
                        <div class="space-y-3">
                            {modalPartnerData.value.partner?.billings?.map((billing: InterfaceBilling) => (
                                <div key={billing._id} class="p-4 bg-blue-50 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-3 relative group">
                                    <button onClick$={() => {
                                        modalPartnerData.value.partner.billings = modalPartnerData.value.partner.billings.filter((b: InterfaceBilling) => b !== billing);
                                        modalPartnerData.value = {...modalPartnerData.value};
                                    }} class="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><MinusCircle class="w-4 h-4" /></button>
                                    <div class="md:col-span-2">
                                        <label class="text-[10px] uppercase text-gray-400 font-bold">Tên đơn vị xuất hóa đơn</label>
                                        <input type="text" 
                                            value={billing.name}
                                            onChange$={(e) => {
                                                billing.name = (e.target as HTMLInputElement).value;
                                                modalPartnerData.value = {...modalPartnerData.value};
                                            }}
                                            class="w-full text-xs p-2 rounded border border-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="VD: Công ty CP WinCommerce"
                                        />
                                    </div>
                                    <div>
                                        <label class="text-[10px] uppercase text-gray-400 font-bold">Mã số thuế</label>
                                        <input type="text" value={billing.taxNumber} onChange$={(e) => {
                                            billing.taxNumber = (e.target as HTMLInputElement).value;
                                            modalPartnerData.value = {...modalPartnerData.value};
                                        }} class="w-full text-xs p-2 rounded border border-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="MST"/>
                                    </div>
                                    <div>
                                        <label class="text-[10px] uppercase text-gray-400 font-bold">Địa chỉ văn phòng</label>
                                        <input type="text" value={billing.location} onChange$={(e) => {
                                            billing.location = (e.target as HTMLInputElement).value;
                                            modalPartnerData.value = {...modalPartnerData.value};
                                        }} class="w-full text-xs p-2 rounded border border-gray-200 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Địa chỉ ghi trên hóa đơn"/>
                                    </div>
                                </div>
                            ))}
                            { !modalPartnerData.value.partner?.billings?.length && (
                                <div class="text-center p-4 text-gray-400 text-sm italic">Bấm "Thêm đơn vị" để cấu hình thông tin xuất hóa đơn VAT</div>
                            )}
                        </div>
                    </section>
                </div>
                    <div class="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick$={() => {modalPartnerData.value = {open: false, partner: null}}} class="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">HỦY</button>
                    <button onClick$={handleSavePartner} class="px-10 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <CheckCircle class="w-5 h-5" /> LƯU THÔNG TIN ĐỐI TÁC
                    </button>
                </div>
            </div>
        </div>
    )
});