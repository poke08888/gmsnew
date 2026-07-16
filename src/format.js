const VN_TZ = 'Asia/Ho_Chi_Minh';
const nfVND = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nfTy = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const dtfVN = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatVND(n) {
  return `${nfVND.format(Math.round(n || 0))}đ`;
}

export function formatTy(n) {
  return `${nfTy.format((n || 0) / 1e9)} tỷ`;
}

export function formatDateTimeVN(date) {
  // vi-VN gives "16/07/2026 11:21" (parts: dd/mm/yyyy, HH:mm)
  const parts = dtfVN.formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function progressBar(progress) {
  const filled = Math.round((Math.min(100, progress) / 100) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

export function buildMessage(d) {
  const lines = [];
  lines.push(`🛒 <b>ĐƠN HÀNG MỚI</b> — <code>${escapeHtml(d.orderCode)}</code>`);
  lines.push(`🏷 Brand: ${escapeHtml(d.brandName)} · Kênh: ${escapeHtml(d.channelName)} · Đối tác: ${escapeHtml(d.partnerName)}`);
  lines.push(`👤 NV: ${escapeHtml(d.userName)} · 🕒 ${formatDateTimeVN(d.createdAt)}`);
  lines.push('');
  lines.push(`📦 ${d.itemCount} mặt hàng · ${d.unitCount} sản phẩm`);
  lines.push(`💵 Doanh thu đơn: Net <b>${formatVND(d.orderNet)}</b> · Gross <b>${formatVND(d.orderGross)}</b>`);
  lines.push('');
  lines.push('📈 <b>Luỹ kế theo ngày tạo đơn (giờ VN)</b>');
  lines.push(`• Hôm nay: Net ${formatVND(d.today.net)} · Gross ${formatVND(d.today.gross)}`);
  lines.push(`• Tháng ${d.monthLabel}: Net ${formatVND(d.month.net)} · Gross ${formatVND(d.month.gross)}`);
  lines.push('');
  lines.push(`🎯 <b>Tiến độ KPI kênh — tháng ${d.monthLabel}</b>`);
  if (!d.kpis || d.kpis.length === 0) {
    lines.push('• Chưa đặt KPI kênh cho tháng này');
  } else {
    for (const k of d.kpis) {
      const mark = k.isOrderChannel ? '⭐' : '•';
      lines.push(
        `${mark} ${escapeHtml(k.channelName)}: <b>${nfTy.format(k.progress)}%</b> ` +
        `(${formatTy(k.currentValue)} / ${formatTy(k.amount)})`,
      );
      lines.push(`   <code>${progressBar(k.progress)}</code>`);
    }
  }
  return lines.join('\n');
}
