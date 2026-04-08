import { component$, isServer, useSignal, useStore, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, server$, type DocumentHead } from "@builder.io/qwik-city";
import ApexCharts from 'apexcharts';



import Header from "~/components/dashboard/Header";
import GlobalStats from "~/components/dashboard/GlobalStats";
import ChannelStats from "~/components/dashboard/ChannelStats";
import { Brand } from "~/models/brand.model";
import { EnumKPIType, EnumUserCustomPermission, EnumUserRole } from "~/types/common";
import { verifyJWT } from "~/services/hash.service";
import { Partner } from "~/models/partner.model";
import { Order } from "~/models/order.model";
import { LuBriefcase, LuUsers } from "@qwikest/icons/lucide";
import PartnerTable from "~/components/dashboard/PartnerTable";
import KPITable from "~/components/dashboard/KPITable";
import { KPI } from "~/models/kpi.model";
import { Channel } from "~/models/channel.model";
import { User } from "~/models/user.model";
import { connectDB } from "~/libs/db";

const useBrands = routeLoader$(async ({ sharedMap }) => {
  const user = sharedMap.get("user");
  if (!user) return [];

  let isAdmin = user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

  const brands = await Brand.find({}).lean()
  return brands
})


const useGlobalStats = server$(async function (timeRangeType: string, brand: string, startDate: string, endDate: string) {
  const session = this.sharedMap.get('session');
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  await connectDB();
  const user = await User.findOne({ _id: session.user._id });
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  

  let isAdmin = user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

  const partners = (await Partner.aggregate([
    {
      $match: {
        $expr: {
          $or: [
            { $eq: [isAdmin, true] },
            { $in: ["$channelId", user.assignedChannels] },
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        partners: { $addToSet: "$_id" }
      }
    },
    { $project: { partners: 1 } }
  ]))[0]?.partners || []
  let startOrderDate = '';
  let endOrderDate = '';
  //
  if (timeRangeType == 'custom') {
    startOrderDate = startDate;
    endOrderDate = endDate;
  } else if (timeRangeType == 'today') {
    startOrderDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    endOrderDate = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
  } else if (timeRangeType == 'week') {
    startOrderDate = new Date(new Date().setHours(0, 0, 0, 0) - ((new Date().getDay() || 7) - 1) * 86400000).toISOString();
    endOrderDate = new Date(new Date(startOrderDate).getTime() + 7 * 86400000 - 1).toISOString();
  }
  else if (timeRangeType == 'month') {
    startOrderDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    endOrderDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  }
  else if (timeRangeType == 'quarter') {
    startOrderDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString();
    endOrderDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999).toISOString();
  } else if (timeRangeType == 'year') {
    startOrderDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
    endOrderDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
  }

  const channelStats = await Order.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ["$orderDate", new Date(startOrderDate)] },
            { $lte: ["$orderDate", new Date(endOrderDate)] },
            {
              $cond: [
                { $eq: [brand, 'all'] },
                true,
                { $eq: ["$brandId", brand] }
              ]
            },
            {
              $or: [
                { $eq: [isAdmin, true] },
                { $in: ["$partnerId", partners] },
                { $in: ["$brandId", user.assignedBrands] },
              ]
            }

          ]
        }
      }
    },
    {
      $lookup: {
        from: "partners",
        localField: "partnerId",
        foreignField: "_id",
        as: "partner"
      }
    },
    { $unwind: "$partner" },
    {
      $lookup: {
        from: 'channels',
        localField: 'partner.channelId',
        foreignField: '_id',
        as: 'channel'
      }
    },
    { $unwind: "$channel" },
    {
      $addFields: {
        totalNetRevenue: {
          $sum: {
            $map: {
              input: "$items",
              as: "items",
              in: { $sum: { $multiply: ["$$items.netprice", "$$items.qty"] } }
            }
          }
        },
        totalQty: {
          $sum: {
            $map: {
              input: "$items",
              as: "items",
              in: { $sum: "$$items.qty" }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: "$channel._id",
        channelName: { $first: "$channel.name" },
        totalOrders: { $sum: 1 },
        totalNetRevenue: { $sum: "$totalNetRevenue" },
        totalQty: { $sum: "$totalQty" }
      }
    },
    {
      $project: {
        _id: 1,
        channelId: "$_id",
        channelName: 1,
        totalOrders: 1,
        totalNetRevenue: 1,
        totalQty: 1
      }
    },
    {
      $lookup: {
        from: 'kpis',
        let: { channelId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$type', EnumKPIType.CHANNEL] },
                  { $eq: ['$targetId', '$$channelId'] },
                  // { $gte: ['$timeframe', startOrderDate.slice(0,7) ] },
                  // { $lte: ['$timeframe', endOrderDate.slice(0,7) ] },
                ]
              }
            }
          }
        ],
        as: 'kpis'
      }
    }
  ])
  // console.log("channelStats", JSON.stringify(channelStats, null, 2));


  const summaryStats = (await Order.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ["$orderDate", new Date(startOrderDate)] },
            { $lte: ["$orderDate", new Date(endOrderDate)] },
            {
              $cond: [
                { $eq: [brand, 'all'] },
                true,
                { $eq: ["$brandId", brand] }
              ]
            },
            {
              $or: [
                { $eq: [isAdmin, true] },
                { $in: ["$partnerId", partners] },
                { $in: ["$brandId", user.assignedBrands] },
              ]
            }

          ]
        }
      }
    },
    {
      $addFields: {
        totalListRevenue: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $sum: { $multiply: ["$$item.listprice", "$$item.qty"] } }
            }
          }
        },
        totalNetRevenue: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $sum: { $multiply: ["$$item.netprice", "$$item.qty"] } }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalListRevenue: { $sum: "$totalListRevenue" },
        totalNetRevenue: { $sum: "$totalNetRevenue" },
      }
    },
    {
      $project: {
        _id: 0, totalOrders: 1, totalListRevenue: 1, totalNetRevenue: 1
      }
    }

  ]))[0] || { totalOrders: 0, totalListRevenue: 0, totalNetRevenue: 0 };

  const partnerStats = await Order.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ["$orderDate", new Date(startOrderDate)] },
            { $lte: ["$orderDate", new Date(endOrderDate)] },
            {
              $cond: [
                { $eq: [brand, 'all'] },
                true,
                { $eq: ["$brandId", brand] }
              ]
            },
            {
              $or: [
                { $eq: [isAdmin, true] },
                { $in: ["$partnerId", partners] },
                { $in: ["$brandId", user.assignedBrands] },
              ]
            }

          ]
        }
      }
    },
    {
      $addFields: {
        totalListRevenue: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $sum: { $multiply: ["$$item.listprice", "$$item.qty"] } }
            }
          }
        },
        totalNetRevenue: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $sum: { $multiply: ["$$item.netprice", "$$item.qty"] } }
            }
          }
        },
        totalQty: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: { $sum: "$$item.qty" }
            }
          }
        }

      }
    },

    {
      $lookup: {
        from: "partners",
        localField: "partnerId",
        foreignField: "_id",
        as: "partner"
      }
    },
    { $unwind: "$partner" },
    {
      $group: {
        _id: "$partnerId",
        partnerName: { $first: "$partner.name" },
        totalOrders: { $sum: 1 },
        totalListRevenue: { $sum: "$totalListRevenue" },
        totalNetRevenue: { $sum: "$totalNetRevenue" },
        totalQty: { $sum: "$totalQty" }
      }
    },
    { $sort: { totalNetRevenue: -1 } },
    { $limit: 10 },
  ])
  return { success: true, data: { totalOrders: summaryStats.totalOrders, totalListRevenue: summaryStats.totalListRevenue, totalNetRevenue: summaryStats.totalNetRevenue, totalPartners: partnerStats.length, channelStats: channelStats, partnerStats: partnerStats } };

})

const useKPIs = routeLoader$(async ({ sharedMap }) => {
  const user = sharedMap.get("user");
  if (!user) return [];

  const isAdmin = user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

  const rawKpis = isAdmin
    ? await KPI.find({}).lean()
    : await KPI.find({
      $or: [
        { type: EnumKPIType.CHANNEL },
        { type: EnumKPIType.PARTNER },
        { $and: [{ type: EnumKPIType.USER }, { targetId: String(user._id) }] }
      ]
    }).lean();

  const results: any[] = [];
  for (const kpi of rawKpis) {
    const [yrStr, moStr] = (kpi.timeframe || '').split('-');
    const year = Number(yrStr) || new Date().getFullYear();
    const month = Number(moStr) || 12;

    let startDate: Date;
    let endDate: Date;

    if (kpi.period === 'MONTH') {
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (kpi.period === 'QUARTER') {
      const endMonth = month;
      const startMonth = endMonth - 2;
      startDate = new Date(year, startMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, endMonth, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    let currentValue = 0;

    if (kpi.type === EnumKPIType.CHANNEL) {
      const partnerIds: string[] = await Partner.find({ channelId: kpi.targetId }).distinct('_id');
      const channelName = await Channel.findOne({ _id: kpi.targetId }).then(c => c?.name || '');
      if (partnerIds.length > 0) {
        const agg = await Order.aggregate([
          { $match: { orderDate: { $gte: startDate, $lte: endDate }, partnerId: { $in: partnerIds } } },
          {
            $addFields: {
              totalListRevenue: {
                $sum: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: { $multiply: ["$$item.listprice", "$$item.qty"] }
                  }
                }
              }
            }
          },
          { $group: { _id: null, total: { $sum: "$totalListRevenue" } } },
        ]);
        currentValue = agg[0]?.total || 0;
        (kpi as any).name = channelName
      }
    } else if (kpi.type === EnumKPIType.PARTNER) {
      const partnerName = await Partner.findOne({ _id: kpi.targetId }).then(p => p?.name || '');
      const agg = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate, $lte: endDate }, partnerId: kpi.targetId } },
        {
          $lookup: {
            from: 'partners',
            pipeline: [{
              $match: { _id: kpi.targetId }
            }],
            as: 'partner'
          }
        },
        {
          $addFields: {
            totalListRevenue: {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: { $multiply: ["$$item.listprice", "$$item.qty"] }
                }
              }
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalListRevenue" }, name: { $first: "$partner.name" } } }
      ]);
      currentValue = agg[0]?.total || 0;
      (kpi as any).name = partnerName;
    } else if (kpi.type === EnumKPIType.USER) {
      const userName = await User.findOne({ _id: kpi.targetId }).then(u => u?.name || '');
      const agg = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate, $lte: endDate }, userId: kpi.targetId } },
        {
          $lookup: {
            from: 'users',
            pipeline: [{
              $match: { _id: kpi.targetId }
            }],
            as: 'user'
          }
        },
        {
          $addFields: {
            totalListRevenue: {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: { $multiply: ["$$item.listprice", "$$item.qty"] }
                }
              }
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalListRevenue" }, name: { $first: "$user.name" } } }
      ]);
      currentValue = agg[0]?.total || 0;
      (kpi as any).name = userName;
    }

    const amount = Number(kpi.amount) || 0;
    const progress = amount > 0 ? Math.min(100, Math.round((currentValue / amount) * 10000) / 100) : 0;

    results.push({ ...kpi, currentValue, progress, periodStart: startDate.toISOString(), periodEnd: endDate.toISOString() });
  }
  // console.log("KPIs", results);
  return results;

})

export default component$(() => {
  const kpis = useKPIs();
  const brands = useBrands();
  const filter = useStore({ brand: 'all', timeRangeType: 'today', startDate: '', endDate: '' });
  const stats = useSignal<any>({ totalOrders: 0, totalListRevenue: 0, totalNetRevenue: 0, totalPartners: 0, channelStats: [], partnerStats: [] });
  useTask$(async ({ track, cleanup }) => {
    track(() => [filter.brand, filter.timeRangeType, filter.startDate, filter.endDate]);

    if (isServer) {
      const res = await useGlobalStats(filter.timeRangeType, filter.brand, filter.startDate, filter.endDate);
      if (res.success) {
        stats.value = res.data;
      }
    }

    const id = setTimeout(async () => {
      const res = await useGlobalStats(filter.timeRangeType, filter.brand, filter.startDate, filter.endDate);
      if (res.success) {
        stats.value = res.data;
      }
      // else {
      //   alert(res.message);
      // }
    }, 500);

    cleanup(() => clearTimeout(id));
  })


  const chartRef = useSignal<Element>();

  useVisibleTask$(({ track }) => {
    track(() => stats.value);
    const charts = new ApexCharts(chartRef.value, {
      chart: { type: 'pie', height: 300 },
      series: stats.value.channelStats.map((c: any) => c.totalNetRevenue),
      labels: stats.value.channelStats.map((c: any) => c.channelName),
    });
    charts.render();
    return () => {
      charts.destroy();
    };
  });


  // })
  // const globalStats = useGlobalStats(filter.timeRangeType, filter.brand, filter.startDate, filter.endDate);
  return (
    <div class="space-y-8 animate-fade-in pb-12">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Tổng Quan Kinh Doanh
        </h1>
        <Header brands={brands.value || []} filter={filter} />
      </div>
      <GlobalStats stats={stats.value} />
      <ChannelStats stats={stats.value.channelStats} />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1 flex flex-col justify-center">
          <h3 class="text-gray-800 font-bold mb-6 text-center">Tỷ Trọng Theo Kênh</h3>
          <div ref={chartRef} class="h-64 w-full"></div>
        </div>


        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2"><LuUsers class="w-5 h-5 text-indigo-600" /> Đối Tác</h2>
          </div>
          <PartnerTable partners={stats.value.partnerStats} />
        </div>

      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 bg-indigo-50 flex justify-between items-center">
          <h2 class="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <LuBriefcase class="w-5 h-5" />
            KPI
          </h2>
        </div>
        <KPITable kpi={kpis.value} />
      </div>
    </div>

  );
});

export const head: DocumentHead = {
  title: "Dashboard GlowMe",
  meta: [
    {
      name: "description",
      content: "Dashboard hệ thống quản lý GlowMe",
    },
  ],
};
