import { fetchOrderContext, cumulativeByCreatedAt, channelKpiProgress } from './queries.js';
import { orderNet, orderGross, dayRangeVN, monthRangeVN, vnMonthLabel } from './revenue.js';

export async function buildOrderMessageData(db, order, now) {
  const ctx = await fetchOrderContext(db, order);
  const [today, month, kpis] = await Promise.all([
    cumulativeByCreatedAt(db, dayRangeVN(now)),
    cumulativeByCreatedAt(db, monthRangeVN(now)),
    channelKpiProgress(db, now, ctx.channelId),
  ]);
  const items = order.items || [];
  return {
    orderCode: order.orderCode || order._id,
    brandName: ctx.brandName,
    channelName: ctx.channelName,
    partnerName: ctx.partnerName,
    userName: ctx.userName,
    createdAt: order.createdAt ? new Date(order.createdAt) : now,
    itemCount: items.length,
    unitCount: items.reduce((t, i) => t + (i.qty || 0), 0),
    orderNet: orderNet(order),
    orderGross: orderGross(order),
    today,
    month,
    monthLabel: vnMonthLabel(now),
    kpis,
  };
}
