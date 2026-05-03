//@ts-nocheck
import { component$, isBrowser, useComputed$ } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";
import { LuX as X } from "@qwikest/icons/lucide";
import { InterfaceOrder } from "~/types/common";

interface Props {
    orderAction: { order: InterfaceOrder | null, action: string };
}

export default component$(({ orderAction }: Props) => {
    const getOrderSlipHTML = useComputed$(() => {
        const order = orderAction.order;
        if (!order) return '';
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        return `
    <div id="invoice-content" style="padding: 40px; font-family: 'Inter', sans-serif; color: #111827; max-width: 900px; margin: 0 auto; background: white; font-size: 13px;">
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #4f46e5; margin: 0 0 10px 0; text-transform: uppercase;">Công Ty TNHH GLOWME</h1>
        <div style="display: flex; justify-content: space-between;">
           <div style="width: 65%;">
             <p style="margin: 3px 0;"><strong>Mã số thuế:</strong> 2803127857</p>
             <p style="margin: 3px 0;"><strong>Địa chỉ Thuế:</strong> Số nhà 35, đường Ngô Quyền, khu phố 5, Phường Bỉm Sơn, Tỉnh Thanh Hóa, Việt Nam</p>
             <p style="margin: 3px 0;"><strong>Email:</strong> sale@glowme.vn</p>
             <p style="margin: 3px 0;"><strong>Tổng đài hỗ trợ:</strong> 1900 4628</p>
           </div>
           <div style="width: 30%; text-align: right;">
             <p style="margin: 3px 0; font-size: 16px; font-weight: bold; color: #4f46e5;">PHIẾU ĐẶT HÀNG</p>
             <p style="margin: 3px 0; color: #6b7280;">${order.name ? `Tên: ${order.name}` : `Mã đơn: #${order.orderCode}`}</p>
             <p style="margin: 3px 0; color: #6b7280;">Ngày đặt: ${formatDate(order.orderDate.toDateString())}</p>
           </div>
        </div>
      </div>

      <div style="display:flex; gap: 20px; margin-bottom: 25px;">
          <div style="flex: 1; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #4f46e5; font-weight: 700; margin: 0 0 10px 0;">Thông tin đối tác</h3>
            <p style="margin: 4px 0;"><strong>Nhà phân phối:</strong> ${typeof order.partnerId === 'string' ? order.partnerId : order.partnerId?.name}</p>
            <p style="margin: 4px 0;"><strong>Thương hiệu:</strong> ${typeof order.brandId === 'string' ? order.brandId : order.brandId?.name}</p>
            <p style="margin: 4px 0;"><strong>Địa chỉ giao hàng:</strong> ${typeof order.warehouseId === 'string' ? order.warehouseId : order.warehouseId?.location || 'Chưa cập nhật'}</p>
            <p style="margin: 4px 0;"><strong>Người nhận:</strong> ${typeof order.warehouseId === 'string' ? '---' : order.warehouseId?.contactName || '---'} ${typeof order.warehouseId === 'string' ? '' : order.warehouseId?.contactPhone ? `- ${order.warehouseId?.contactPhone}` : ''}</p>
          </div>

          <div style="flex: 1; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #4f46e5; font-weight: 700; margin: 0 0 10px 0;">Thông tin xuất hóa đơn</h3>
            ${order.billingId ? `
                <p style="margin: 4px 0;"><strong>Tên đơn vị:</strong> ${typeof order.billingId === 'string' ? order.billingId : order.billingId?.name}</p>
                <p style="margin: 4px 0;"><strong>MST:</strong> ${typeof order.billingId === 'string' ? '' : order.billingId?.taxNumber}</p>
                <p style="margin: 4px 0;"><strong>Địa chỉ:</strong> ${typeof order.billingId === 'string' ? '' : order.billingId?.location}</p>
            ` : `
                <p style="margin: 4px 0; color: #6b7280; font-style: italic;">Không có thông tin hóa đơn được chọn.</p>
            `}
          </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #4f46e5; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #4f46e5;">SKU</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #4f46e5;">Tên sản phẩm</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">SL</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #e5e7eb;">Giá niêm yết</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">Thực nhận</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 500;">${item.sku}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 500;">${item.name}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${item.qty}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #6b7280;">${new Intl.NumberFormat('vi-VN').format(item.listprice)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid;">
         <div style="text-align: center; width: 30%;">
            <p style="font-weight: 600; margin-bottom: 50px;">Người lập phiếu</p>
            <p style="font-size: 12px; font-style: italic;">(Ký, họ tên)</p>
         </div>
         <div style="text-align: center; width: 30%;">
            <p style="font-weight: 600; margin-bottom: 50px;">Người giao hàng</p>
            <p style="font-size: 12px; font-style: italic;">(Ký, họ tên)</p>
         </div>
         <div style="text-align: center; width: 30%;">
            <p style="font-weight: 600; margin-bottom: 50px;">Khách hàng</p>
            <p style="font-size: 12px; font-style: italic;">(Ký, họ tên)</p>
         </div>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        <p>Cảm ơn quý khách đã tin tưởng và hợp tác cùng GLOWME!</p>
      </div>
    </div>
  `;
    });

    const generatePDF = $(async () => {
        if (!isBrowser) return;
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.createElement('div');
        element.innerHTML = getOrderSlipHTML.value;

        const opt = {
            margin: 10,
            filename: `GlowMe_Phieu_dat_hang_${orderAction.order?._id}.pdf`,
            image: { type: 'png', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (html2pdf) {
            await html2pdf().set(opt as any).from(element).save();
        } else {
            alert("Hệ thống tạo PDF đang khởi động. Vui lòng thử lại sau giây lát.");
        }
    });

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h3 class="font-bold text-gray-800 flex items-center gap-2">Phiếu Đặt Hàng: {orderAction.order?.name || orderAction.order?._id}</h3>
                    <div class="flex items-center gap-2">
                        <button onClick$={generatePDF} class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Tải PDF</button>
                        <button onClick$={() => {orderAction.action = ''; orderAction.order = null}} class="text-gray-500 p-1.5 rounded-lg"><X class="w-5 h-5" /></button>
                    </div>
                </div>
                <div class="flex-1 overflow-auto bg-gray-100 p-4">
                    <div class="shadow-lg mx-auto" dangerouslySetInnerHTML={getOrderSlipHTML.value}></div>
                </div>
            </div>
        </div>
    );
});
