export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function sumItems(order, field) {
  return (order?.items || []).reduce(
    (total, it) => total + (it?.[field] || 0) * (it?.qty || 0),
    0,
  );
}
export const orderNet = (order) => sumItems(order, 'netprice');
export const orderGross = (order) => sumItems(order, 'grossprice');
export const orderList = (order) => sumItems(order, 'listprice');

function vnParts(now) {
  const d = new Date(now.getTime() + VN_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}

export function dayRangeVN(now) {
  const { y, m, d } = vnParts(now);
  const start = new Date(Date.UTC(y, m, d) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, d + 1) - VN_OFFSET_MS - 1);
  return { start, end };
}

export function monthRangeVN(now) {
  const { y, m } = vnParts(now);
  const start = new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(y, m + 1, 1) - VN_OFFSET_MS - 1);
  return { start, end };
}

export function vnMonthLabel(now) {
  const { y, m } = vnParts(now);
  return `${String(m + 1).padStart(2, '0')}/${y}`;
}

export function kpiProgress(currentValue, amount) {
  if (!amount || amount <= 0) return 0;
  return Math.min(100, Math.round((currentValue / amount) * 10000) / 100);
}

function parseTimeframe(timeframe, now) {
  const vp = vnParts(now);
  const [yrStr, moStr] = String(timeframe || '').split('-');
  const year = Number(yrStr) || vp.y;
  const month = Number(moStr) || vp.m + 1;
  return { year, month };
}

export function isCurrentPeriod(kpi, now) {
  const vp = vnParts(now);
  const curYear = vp.y;
  const curMonth = vp.m + 1;
  const curQuarter = Math.floor((curMonth - 1) / 3) + 1;
  const { year, month } = parseTimeframe(kpi.timeframe, now);
  const quarter = Math.floor((month - 1) / 3) + 1;
  if (kpi.period === 'MONTH') return year === curYear && month === curMonth;
  if (kpi.period === 'QUARTER') return year === curYear && quarter === curQuarter;
  if (kpi.period === 'YEAR') return year === curYear;
  return false;
}

export function periodRangeVN(kpi, now) {
  const { year, month } = parseTimeframe(kpi.timeframe, now);
  let startMonth;
  let endMonth;
  if (kpi.period === 'MONTH') {
    startMonth = month;
    endMonth = month;
  } else if (kpi.period === 'QUARTER') {
    endMonth = month;
    startMonth = month - 2;
  } else {
    startMonth = 1;
    endMonth = 12;
  }
  const start = new Date(Date.UTC(year, startMonth - 1, 1) - VN_OFFSET_MS);
  const end = new Date(Date.UTC(year, endMonth, 1) - VN_OFFSET_MS - 1);
  return { start, end };
}
