import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { LuArrowLeft, LuDollarSign, LuPackage, LuUsers } from "@qwikest/icons/lucide";

import ApexCharts from 'apexcharts';

interface Props {
    product: any,
    onOpenProductDetail: { isOpen: boolean, product: any }
}
export default component$(({ onOpenProductDetail, product }: Props) => {
    const chartByPartnerRevenueRef = useSignal<Element>();
    const chartByPartnerOrdersRef = useSignal<Element>();
    const chartByPartnerProductsRef = useSignal<Element>();
    const topPartnersByRevenue = [...(product.partners ?? [])]
        .sort((a: any, b: any) => b.totalNetRevenue - a.totalNetRevenue)
        .slice(0, 10);

    useVisibleTask$(() => {
        const chartByPartnerRevenue = new ApexCharts(chartByPartnerRevenueRef.value, {
            chart: { type: 'pie', height: 300 },
            series: topPartnersByRevenue.map((p: any) => p.totalNetRevenue),
            labels: topPartnersByRevenue.map((p: any) => p.partnerName),
        })
        chartByPartnerRevenue.render();

        const chartByPartnerOrders = new ApexCharts(chartByPartnerOrdersRef.value, {
            chart: { type: 'bar', height: 300 },
            series: [{ data: topPartnersByRevenue.map((p: any) => p.totalOrders) }],
            labels: topPartnersByRevenue.map((p: any) => p.partnerName),
        })
        chartByPartnerOrders.render();

        const chartByPartnerProducts = new ApexCharts(chartByPartnerProductsRef.value, {
            chart: { type: 'pie', height: 300 },
            series: topPartnersByRevenue.map((p: any) => p.totalQty),
            labels: topPartnersByRevenue.map((p: any) => p.partnerName),
        })
        chartByPartnerProducts.render();
        return () => {
            chartByPartnerRevenue.destroy();
            chartByPartnerOrders.destroy();
            chartByPartnerProducts.destroy();
        }
    })

    return (
        <div class="space-y-6 animate-fade-in">
            <button onClick$={() => { onOpenProductDetail.isOpen = false; onOpenProductDetail.product = null; }} class="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                <LuArrowLeft class="w-4 h-4" /> Quay lại danh sách
            </button>

            <div>
                <h1 class="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="p-3 bg-indigo-100 rounded-full text-indigo-600"><LuDollarSign class="w-6 h-6" /></div>
                    <div>
                        <p class="text-sm text-gray-500">Tổng Doanh Thu</p>
                        <p class="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalNetRevenue)}</p>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="p-3 bg-blue-100 rounded-full text-blue-600"><LuPackage class="w-6 h-6" /></div>
                    <div>
                        <p class="text-sm text-gray-500">Tổng Số Lượng Bán</p>
                        <p class="text-2xl font-bold text-gray-900">{product.totalQty.toLocaleString()}</p>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="p-3 bg-green-100 rounded-full text-green-600"><LuUsers class="w-6 h-6" /></div>
                    <div>
                        <p class="text-sm text-gray-500">Số Đối Tác Đã Mua</p>
                        <p class="text-2xl font-bold text-gray-900">{product.partners.length}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 text-center">Tỷ Trọng Doanh Thu Theo Đối Tác</h3>
                    <div class="h-80 w-full">
                        <div ref={chartByPartnerRevenueRef} class="w-full h-full"></div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 text-center">Tỷ Trọng Lượng Hàng Bán Theo Đối Tác</h3>
                    <div class="h-80 w-full">
                        <div ref={chartByPartnerProductsRef} class=""></div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 class="text-lg font-bold text-gray-800 mb-6 text-center">Đơn hàng mua theo đối tác</h3>
                    <div class="h-80 w-full">
                        <div ref={chartByPartnerOrdersRef} class="w-full h-full"></div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn mua</th>
                                    <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lượng hàng</th>
                                    <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh Thu</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {topPartnersByRevenue.map((partner: any) => (
                                    <tr
                                        class="hover:bg-indigo-50 cursor-pointer transition-colors"
                                    >
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{partner.partnerName}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-bold text-gray-900">{partner.totalOrders}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                                            {partner.totalQty.toLocaleString()}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(partner.totalNetRevenue)}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

        </div>
    )
})
