import { component$, useSignal, $ } from '@builder.io/qwik';
import { InterfaceOrderItem } from '~/types/common';

interface Props {
    file: {value: {items: any[], rawFile: File | null}}
}

export default component$(({file}: Props) => {
    if (!file.value.rawFile) return null;
    return (
        <>
            <div class="space-y-2">
                <h2 class="block text-sm font-medium text-gray-700">Quản lý order</h2>
                <p class="text-gray-600">Click trực tiếp vào các ô để chỉnh sửa thông tin nhanh.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn giá</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giá chiết khấu</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giá sau thuế</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {file.value.items?.map((item: InterfaceOrderItem) => (
                            <tr class="hover:bg-blue-50 transition-colors">
                                <td class="px-6 py-4 text-sm text-gray-500">
                                    
                                    <span contentEditable="true" onChange$={(e:any) => {item.sku = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700">{item.sku}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="text" value={item.name} onChange$={(e:any) => {item.name = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700"/>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="text" value={item.listprice} onChange$={(e:any) => {item.listprice = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700"/>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="text" value={item.qty} onChange$={(e:any) => {item.qty = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700"/>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="text" value={item.netprice} onChange$={(e:any) => {item.netprice = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700"/>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="text" value={item.grossprice} onChange$={(e:any) => {item.grossprice = e.target.value; file.value = {...file.value}}}
                                class="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1 transition-all font-medium text-gray-700"/>
                                </td>
                                <td class="px-6 py-4">
                                    {item.grossprice * item.qty}
                                </td>
                            </tr>
                        ))}

                        
                    </tbody>
                </table>
                <label class="block text-sm font-medium text-gray-700">Tổng tiền trước thuế: {file.value.items.map(item => item.netprice * item.qty).reduce((a, b) => a + b, 0)}</label>
                <label class="block text-sm font-medium text-gray-700">Tổng tiền sau thuế: {file.value.items.map(item => item.grossprice * item.qty).reduce((a, b) => a + b, 0)}</label>
            </div>

            
        </>
    )
})