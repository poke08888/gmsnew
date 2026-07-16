import { isCurrentPeriod, periodRangeVN, kpiProgress } from './revenue.js';

// "Doanh thu" = netprice (sau CK), "Trước CK" = listprice — same rule as the GMS dashboard
// (GlobalStats: TỔNG DOANH THU = totalNetRevenue, TRƯỚC CHIẾT KHẤU = totalListRevenue).
const netListFields = {
  net: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.netprice', '$$i.qty'] } } } },
  list: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.listprice', '$$i.qty'] } } } },
};

export async function fetchOrderContext(db, order) {
  const [brand, partner, user] = await Promise.all([
    db.collection('brands').findOne({ _id: order.brandId }),
    db.collection('partners').findOne({ _id: order.partnerId }),
    db.collection('users').findOne({ _id: order.userId }),
  ]);
  let channel = null;
  if (partner?.channelId) {
    channel = await db.collection('channels').findOne({ _id: partner.channelId });
  }
  return {
    brandName: brand?.name || '—',
    partnerName: partner?.name || '—',
    userName: user?.name || '—',
    channelId: partner?.channelId || null,
    channelName: channel?.name || '—',
  };
}

export async function cumulativeByCreatedAt(db, range) {
  const agg = await db.collection('orders').aggregate([
    { $match: { createdAt: { $gte: range.start, $lte: range.end } } },
    { $addFields: netListFields },
    { $group: { _id: null, net: { $sum: '$net' }, list: { $sum: '$list' } } },
  ]).toArray();
  return { net: agg[0]?.net || 0, list: agg[0]?.list || 0 };
}

export async function channelKpiProgress(db, now, orderChannelId) {
  const kpis = await db.collection('kpis')
    .find({ type: 'Channel', period: 'MONTH' })
    .toArray();
  const current = kpis.filter((k) => isCurrentPeriod(k, now));

  // Dedupe by channel, keep the highest target amount.
  const byChannel = new Map();
  for (const k of current) {
    const prev = byChannel.get(k.targetId);
    if (!prev || (k.amount || 0) > (prev.amount || 0)) byChannel.set(k.targetId, k);
  }

  const results = [];
  for (const kpi of byChannel.values()) {
    const range = periodRangeVN(kpi, now);
    const partnerIds = await db.collection('partners')
      .find({ channelId: kpi.targetId }).map((p) => p._id).toArray();
    const channel = await db.collection('channels').findOne({ _id: kpi.targetId });

    let currentValue = 0;
    if (partnerIds.length) {
      const agg = await db.collection('orders').aggregate([
        { $match: { orderDate: { $gte: range.start, $lte: range.end }, partnerId: { $in: partnerIds } } },
        { $addFields: { listRev: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.listprice', '$$i.qty'] } } } } } },
        { $group: { _id: null, total: { $sum: '$listRev' } } },
      ]).toArray();
      currentValue = agg[0]?.total || 0;
    }

    results.push({
      channelId: kpi.targetId,
      channelName: channel?.name || '—',
      amount: kpi.amount || 0,
      currentValue,
      progress: kpiProgress(currentValue, kpi.amount),
      isOrderChannel: kpi.targetId === orderChannelId,
    });
  }

  results.sort((a, b) => b.progress - a.progress);
  return results;
}
