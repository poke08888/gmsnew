import { component$, useSignal } from "@builder.io/qwik";
import { InterfacePartner, InterfaceBrand, InterfaceUser } from "~/types/common";
interface Props {
    partners: InterfacePartner[];
    orderData: any;
    brands: InterfaceBrand[];
    users: InterfaceUser[]
}

export default component$(({partners, orderData, brands, users}: Props) => {

    const selectedPartner = useSignal(null as InterfacePartner | null);

    return (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Chọn Đối Tác</label>
                <select onChange$={(e:any) => {orderData.value = {...orderData.value, partnerId: e.target.value}; selectedPartner.value = partners.find(p => p._id == e.target.value) || null}} value={orderData.value.partnerId} class="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
                    <option value="">-- Chọn Đối Tác --</option>
                    {partners.map(partner => (
                        <option key={partner._id} value={partner._id}>{partner.name}</option>
                    ))}
                </select>
            </div>

            

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Kho / Điểm Giao Hàng</label>
                <select 
                    value={orderData.value.warehouseId}
                    class={`w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${selectedPartner.value?.warehouses?.length === 0 ? 'bg-gray-100 text-gray-500' : ''}`}
                    onChange$={(e:any) => {orderData.value = {...orderData.value, warehouseId: e.target.value}}}
                >
                    <option value="">{selectedPartner.value?.warehouses?.length == 0 ? '-- Không có thông tin kho --' : '-- Chọn kho giao hàng --'}</option>
                    {selectedPartner.value?.warehouses?.map(warehouse => (
                        <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                    ))}
                </select>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Thông Tin Xuất Hóa Đơn</label>
                <select 
                    value={orderData.value.billingId}
                    class={`w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${selectedPartner.value?.billings?.length === 0 ? 'bg-gray-100 text-gray-500' : ''}`}
                    onChange$={(e:any) => {orderData.value = {...orderData.value, billingId: e.target.value}}}
                >
                    <option value="">{selectedPartner.value?.billings?.length == 0 ? '-- Không có thông tin HĐ --' : '-- Chọn thông tin hóa đơn --'}</option>
                    {selectedPartner.value?.billings?.map(billing => (
                        <option key={billing._id} value={billing._id}>{billing.name}</option>
                    ))}
                </select>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Chọn Thương Hiệu</label>
                <select
                value={orderData.value.brandId}
                onChange$={(e:any) => {orderData.value = {...orderData.value, brandId: e.target.value}}}
                class="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                ))}
                </select>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Nhân Viên Phụ Trách</label>
                <select
                value={orderData.value.userId}
                onChange$={(e:any) => {orderData.value = {...orderData.value, userId: e.target.value}}}
                class="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                <option value="">-- Chọn Sales Rep --</option>
                {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                ))}
                </select>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Ngày Lên Đơn</label>
                <input type="date" 
                    value={orderData.value.orderDate}
                    onChange$={(e:any) => {orderData.value = {...orderData.value, orderDate: e.target.value}}}
                    class="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                </input>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Ngày Giao Hàng</label>
                <input type="date" 
                    value={orderData.value.deliveryDate}
                    onChange$={(e:any) => {orderData.value = {...orderData.value, deliveryDate: e.target.value}}}
                    class="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                </input>
            </div>
        </div>
    )
})