import { component$, isBrowser, useComputed$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { $ } from "@builder.io/qwik";
import { LuX as X } from "@qwikest/icons/lucide";
import { EnumUserRole, InterfaceOrder } from "~/types/common";

import { GetBillingById, GetAllBillings } from "~/services/billing.service";
// import { UpdateOrder } from "~/services/order.service";
import { GetAllPartners } from "~/services/partner.service";
import { GetAllWarehouses } from "~/services/warehouse.service";
import { server$, useNavigate } from "@builder.io/qwik-city";
import { connectDB } from "~/libs/db";
import { Order } from "~/models/order.model";
import { verifyJWT } from "~/services/hash.service";
// import { User } from "~/models/user.model";
import { Partner } from "~/models/partner.model";
interface Props {
    orderAction: { order: InterfaceOrder | null, action: string };
}

// const getBilling = server$(async (billingId: string) => {
//     // console.log('Fetching billing for ID:', billingId);
//     const billing = await GetBillingById(billingId);
//     // console.log('Fetched billing:', billing);
//     return billing;
// });

const loadOptions = server$(async () => {
  const partners = await GetAllPartners();
  const billings = await GetAllBillings();
  const warehouses = await GetAllWarehouses();
  return { partners, billings, warehouses };
});

const saveToServer = server$(async function(order: InterfaceOrder) {
  try{

    const auth_token = this.cookie.get('auth_token')?.value;
    if (!auth_token) {
        return false;
    }
    const user = await verifyJWT(auth_token);
    if (!user) {
        return false;
    }
    await connectDB();
    
    const partner = await Partner.findById(order.partnerId).lean();
    const dbOrder = await Order.findById(order._id).lean();

    if (user.role != EnumUserRole.DIRECTOR && dbOrder?.userId != user._id && !user.assignedChannels?.includes(partner?.channelId) && !user.assignedBrands?.includes(order.brandId)) {
      return false;
    }
    
    if (!order || !order._id) return false;
    const payload: any = JSON.parse(JSON.stringify(order));
    if (payload.billingId && typeof payload.billingId === 'object') payload.billingId = payload.billingId._id || payload.billingId;
    if (payload.warehouseId && typeof payload.warehouseId === 'object') payload.warehouseId = payload.warehouseId._id || payload.warehouseId;
    await Order.updateOne({ _id: order._id }, payload);
    return true;
  } catch (error) {
    console.error('Error updating order:', error);
    return false;
  }
});

export default component$(({ orderAction }: Props) => {
  const nav = useNavigate()
  const draft = useSignal<InterfaceOrder | null>(orderAction.order ? JSON.parse(JSON.stringify(orderAction.order)) : null);

  useVisibleTask$(() => {
    // initialize draft when modal opens or orderAction changes
    draft.value = orderAction.order ? JSON.parse(JSON.stringify(orderAction.order)) : null;
  });

  const options = useSignal<{ partners: any[]; billings: any[]; warehouses: any[] } | null>(null);
  const selectedBillingId = useSignal<string | null>(null);
  const selectedWarehouseId = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    const loaded = await loadOptions();
    options.value = loaded as any;
    if (draft.value) {
      const b = draft.value.billingId;
      selectedBillingId.value = b && typeof b === 'object' ? (b._id || null) : (typeof b === 'string' ? b : null);
      const w = draft.value.warehouseId;
      selectedWarehouseId.value = w && typeof w === 'object' ? (w._id || null) : (typeof w === 'string' ? w : null);
    }
  });

  

  const handleSave = $(async () => {
    if (!draft.value) return;
    try {
      await saveToServer(draft.value);
      // update parent state and close
      orderAction.order = JSON.parse(JSON.stringify(draft.value));
      orderAction.action = '';

    } catch (err) {
      console.error('Error saving order:', err);
      alert('Lưu đơn hàng thất bại. Vui lòng thử lại.');
    }
    await nav();
  });

  const getInvoiceHTML = useComputed$(() => {
    const order = draft.value;
        if (!order) return '';
        const fmtMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        const fmtNum = (num: number) => new Intl.NumberFormat('vi-VN').format(num);
        const formatDate = (dateStr: string) => {
            if(!dateStr) return '';
            const d = new Date(dateStr);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }

        // const VAT_RATE = 0.08;

        const totalPreTax = (order.items || []).reduce((s: number, it: any) => s + (Number(it.netprice || 0) * Number(it.qty || 0)), 0);
        const totalAmount = (order.items || []).reduce((s: number, it: any) => s + (Number(it.grossprice || 0) * Number(it.qty || 0)), 0);
        const totalVAT = totalAmount - totalPreTax;

        // console.log('Billing info:', billing);
        return `
    <div id="invoice-content" style="padding: 40px; font-family: 'Inter', sans-serif; color: #111827; max-width: 900px; margin: 0 auto; background: white; font-size: 13px;">
      
      <!-- HEADER: Company Info -->
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
             <p style="margin: 3px 0; font-size: 16px; font-weight: bold; color: #dc2626;">PHIẾU ĐẶT HÀNG</p>
             <p style="margin: 3px 0; color: #6b7280;">Mã đơn: #${order._id}</p>
             <p style="margin: 3px 0; color: #6b7280;">Ngày đặt: ${formatDate(new Date(order.orderDate).toString())}</p>
           </div>
        </div>
      </div>
      
      <!-- PARTNER INFO -->
      <div style="display:flex; gap: 20px; margin-bottom: 25px;">
          <!-- Left: General Partner Info -->
          <div style="flex: 1; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #4f46e5; font-weight: 700; margin: 0 0 10px 0;">Thông tin đối tác</h3>
            <p style="margin: 4px 0;"><strong>Nhà phân phối:</strong> ${typeof order.partnerId === 'string' ? order.partnerId : order.partnerId?.name}</p>
            <p style="margin: 4px 0;"><strong>Thương hiệu:</strong> ${typeof order.brandId === 'string' ? order.brandId : order.brandId?.name}</p>
            <p style="margin: 4px 0;"><strong>Địa chỉ giao hàng:</strong> ${typeof order.warehouseId === 'string' ? order.warehouseId : order.warehouseId?.name || 'Chưa cập nhật'}</p>
            <p style="margin: 4px 0;"><strong>Người nhận:</strong> ${typeof order.warehouseId === 'string' ? '---' : order.warehouseId?.contactName || '---'} ${typeof order.warehouseId === 'string' ? '' : order.warehouseId?.contactPhone ? `- ${order.warehouseId?.contactPhone}` : ''}</p>
          </div>

          <!-- Right: Billing Info (Thông tin xuất hóa đơn) -->
          <div style="flex: 1; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #4f46e5; font-weight: 700; margin: 0 0 10px 0;">Thông tin xuất hóa đơn</h3>
            ${order.billingId ? `
                <p style="margin: 4px 0;"><strong>Tên đơn vị:</strong> ${typeof order.billingId === 'string' ? order.billingId : order.billingId.name}</p>
                <p style="margin: 4px 0;"><strong>MST:</strong> ${typeof order.billingId === 'string' ? '' : order.billingId.taxNumber}</p>
                <p style="margin: 4px 0;"><strong>Địa chỉ:</strong> ${typeof order.billingId === 'string' ? '' : order.billingId.location}</p>
            ` : `
                <p style="margin: 4px 0; color: #6b7280; font-style: italic;">Không có thông tin hóa đơn được chọn.</p>
            `}
          </div>
      </div>

      <!-- ORDER TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #4f46e5; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #4f46e5;">SKU</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #4f46e5;">Tên sản phẩm</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">SL</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #e5e7eb;">Giá niêm yết</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">ĐG Trước Thuế<br><span style="font-weight:400; font-size: 10px;">(Sau CK)</span></th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">ĐG Sau Thuế<br><span style="font-weight:400; font-size: 10px;">(VAT 8%)</span></th>
            <th style="padding: 10px; text-align: right; border: 1px solid #4f46e5;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => {
            const pricePreTax = item.netprice;
            const pricePostTax = item.grossprice;
            const lineTotal = item.qty * pricePostTax;
            
            return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 500;">${item.sku}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 500;">${item.name}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${item.qty}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; color: #6b7280;">${fmtNum(item.netprice)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${fmtNum(pricePreTax)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${fmtNum(pricePostTax)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: 600;">
                ${fmtNum(lineTotal)}
              </td>
            </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
           <tr>
             <td colspan="6" style="padding: 8px 10px; text-align: right; font-weight: normal; color: #6b7280;">Tổng tiền trước thuế:</td>
             <td style="padding: 8px 10px; text-align: right; font-weight: 600;">${fmtMoney(totalPreTax)}</td>
           </tr>
           <tr>
             <td colspan="6" style="padding: 8px 10px; text-align: right; font-weight: normal; color: #6b7280;">Thuế GTGT (VAT 8%):</td>
             <td style="padding: 8px 10px; text-align: right; font-weight: 600;">${fmtMoney(totalVAT)}</td>
           </tr>
          <tr style="background-color: #eff6ff;">
            <td colspan="6" style="padding: 12px 10px; text-align: right; font-weight: 800; color: #4f46e5; text-transform: uppercase;">TỔNG THANH TOÁN:</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: 800; color: #4f46e5; font-size: 16px;">
              ${fmtMoney(totalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- SIGNATURES -->
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
  `
    })
    const generatePDF = $(async () => {
        if (!isBrowser) return;
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.createElement('div');
      element.innerHTML = getInvoiceHTML.value;

        const opt = {
            margin: 10,
            filename: `GlowMe_Don_hang_${orderAction.order?._id}.pdf`,
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
                    <h3 class="font-bold text-gray-800 flex items-center gap-2">Hóa Đơn: {orderAction.order?._id}</h3>
                    <div class="flex items-center gap-2">
                        <button onClick$={generatePDF} class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Tải PDF</button>
                        <button onClick$={() => {orderAction.action = ''; orderAction.order = null}} class="text-gray-500 p-1.5 rounded-lg"><X class="w-5 h-5" /></button>
                    </div>
                </div>
                <div class="flex-1 overflow-auto bg-gray-100 p-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-white p-4 rounded shadow">
                        <h4 class="font-semibold mb-2">Chỉnh sửa hóa đơn</h4>
                        <div class="space-y-2 mb-3">
                          <label class="text-sm text-gray-600">Kho giao hàng</label>
                          <select class="border rounded px-2 py-1 w-full text-sm" value={selectedWarehouseId.value || ''} onInput$={(e: any) => { const id = e.target.value; selectedWarehouseId.value = id || null; if (!draft.value) return; if (!id) { draft.value.warehouseId = null; return; } const wh = options.value?.warehouses.find(w => w._id === id); if (wh) draft.value.warehouseId = wh; }}>
                            <option value="">-- Chọn kho --</option>
                            {options.value?.warehouses.map(w => (
                              <option value={w._id as string}>{`${w.name} ${w.address ? `- ${w.address}` : ''}`}</option>
                            ))}
                          </select>

                          <label class="text-sm text-gray-600">Chọn thông tin xuất hóa đơn</label>
                          <select class="border rounded px-2 py-1 w-full text-sm" value={selectedBillingId.value || ''} onInput$={(e: any) => { const id = e.target.value; selectedBillingId.value = id || null; if (!draft.value) return; if (!id) { draft.value.billingId = null; return; } const b = options.value?.billings.find(bi => bi._id === id); if (b) draft.value.billingId = b; }}>
                            <option value="">-- Chọn hóa đơn --</option>
                            {options.value?.billings.map(b => (
                              <option value={b._id as string}>{`${b.name} ${b.taxNumber ? `- ${b.taxNumber}` : ''}`}</option>
                            ))}
                          </select>

                          {/* <label class="text-sm text-gray-600">Tên đơn vị (hóa đơn)</label>
                          <input class="border rounded px-2 py-1 w-full text-sm" value={draft.value?.billingId?.name || ''} onInput$={(e: any) => { if (!draft.value) return; draft.value.billingId = draft.value.billingId || ({} as any); draft.value.billingId.name = e.target.value }} />
                          <label class="text-sm text-gray-600">Mã số thuế</label>
                          <input class="border rounded px-2 py-1 w-full text-sm" value={draft.value?.billingId?.taxNumber || ''} onInput$={(e: any) => { if (!draft.value) return; draft.value.billingId = draft.value.billingId || ({} as any); draft.value.billingId.taxNumber = e.target.value }} />
                          <label class="text-sm text-gray-600">Địa chỉ</label>
                          <input class="border rounded px-2 py-1 w-full text-sm" value={draft.value?.billingId?.location || ''} onInput$={(e: any) => { if (!draft.value) return; draft.value.billingId = draft.value.billingId || ({} as any); draft.value.billingId.location = e.target.value }} /> */}
                        </div>
                        <h4 class="font-semibold mb-2">Sản phẩm</h4>
                        <div class="overflow-auto max-h-60">
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="text-left text-xs text-gray-500"><th>SKU</th><th>Tên</th><th>SL</th><th>Giá trước thuế</th><th>Giá sau thuế</th></tr>
                            </thead>
                            <tbody>
                              {draft.value?.items.map((item, idx) => (
                                <tr key={idx} class="border-t">
                                  <td class="py-1">{item.sku}</td>
                                  <td class="py-1">{item.name}</td>
                                  <td class="py-1"><input class="w-16 border rounded px-1 text-sm" type="number" value={item.qty} onInput$={(e: any) => { if (!draft.value) return; draft.value.items[idx].qty = Number(e.target.value) }} /></td>
                                  <td class="py-1"><input class="w-28 border rounded px-1 text-sm" type="number" value={item.netprice} onInput$={(e: any) => { if (!draft.value) return; draft.value.items[idx].netprice = Number(e.target.value) }} /></td>
                                  <td class="py-1"><input class="w-28 border rounded px-1 text-sm" type="number" value={item.grossprice} onInput$={(e: any) => { if (!draft.value) return; draft.value.items[idx].grossprice = Number(e.target.value) }} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div class="bg-white p-4 rounded shadow">
                        <h4 class="font-semibold mb-2">Xem trước hóa đơn</h4>
                        <div class="overflow-auto max-h-96" dangerouslySetInnerHTML={getInvoiceHTML.value}></div>
                      </div>
                    </div>
                </div>
                  <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick$={() => {orderAction.action = ''; orderAction.order = null}} class="px-3 py-1 rounded border">Hủy</button>
                    <button onClick$={handleSave} class="px-3 py-1 rounded bg-green-600 text-white">Lưu</button>
                  </div>
            </div>
        </div>
    )
})