import { component$, isServer, useSignal, useStore, useTask$ } from "@builder.io/qwik";
import { routeLoader$, server$, type DocumentHead } from "@builder.io/qwik-city";

import Header from "~/components/dashboard/Header";
import GlobalStats from "~/components/dashboard/GlobalStats";
import { Brand } from "~/models/brand.model";
import { EnumKPIType, EnumUserCustomPermission, EnumUserRole } from "~/types/common";
import { verifyJWT } from "~/services/hash.service";
import { Partner } from "~/models/partner.model";
import { Order } from "~/models/order.model";

const useBrands = routeLoader$(async ({sharedMap}) => {
  const user = sharedMap.get("user");
  if (!user) return [];

  let isAdmin = user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

  const brands = await Brand.find({}).lean()
  return brands
})


const useGlobalStats = server$(async function (timeRangeType: string, brand: string, startDate: string, endDate: string) {
  const auth_token = this.cookie.get("auth_token")?.value || "";

  const user = await verifyJWT(auth_token)
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  let isAdmin = user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

  const partners = (await Partner.aggregate([
    { $match: {
      $expr: {
        $or: [
          { $eq: [isAdmin, true] },
          { $in: ["$channelId", user.assignedChannels]},
        ]
      }
    }},
    { $group: {
      _id: null,
      partners: { $addToSet: "$_id" }
    }},
    { $project: { partners: 1}}
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
    startOrderDate = new Date(new Date().setHours(0,0,0,0) - ((new Date().getDay() || 7) - 1) * 86400000).toISOString();
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
    { $match: {
      $expr: {
        $and: [
          { $gte: ["$orderDate", new Date(startOrderDate)] },
          { $lte: ["$orderDate", new Date(endOrderDate)] },
          { $cond: [
            { $eq: [brand, 'all'] },
            true,
            { $eq: ["$brandId", brand] }
          ]},
          { $or: [
            { $eq: [isAdmin, true] },
            { $in: ["$partnerId", partners] },
            { $in: ["$brandId", user.assignedBrands]},
          ]}
          
        ]
      }
    }},
    { $lookup: {
      from: "partners",
      localField: "partnerId",
      foreignField: "_id",
      as: "partner"
    }},
    { $unwind: "$partner" },
    { $lookup: {
      from: 'channels',
      localField: 'partner.channelId',
      foreignField: '_id',
      as: 'channel'
    }},
    { $unwind: "$channel" },
    { $addFields: {
      totalNetRevenue: {
        $sum: {
          $map: {
            input: "$items",
            as: "items",
            in: { $sum: { $multiply: ["$$items.netprice", "$$items.qty"] }}
          }
        }
      },
      totalQty: {
        $sum: {
          $map: {
            input: "$items",
            as: "items",
            in: { $sum: "$$items.qty"}
          }
        }
      }
    }},
    { $group: {
      _id: "$channel._id",
      channelName: { $first: "$channel.name" },
      totalOrders: { $sum: 1 },
      totalNetRevenue: { $sum: "$totalNetRevenue" },
      totalQty: { $sum: "$totalQty" }
    }},
    { $project: {
      _id: 1,
      channelId: "$_id",
      channelName: 1,
      totalOrders: 1,
      totalNetRevenue: 1,
      totalQty: 1
    }},
    { $lookup: {
      from: 'kpis',
      let: {channelId: '$_id'},
      pipeline: [
        { $match: {
          $expr: {
            $and: [
              { $eq: ['$type', EnumKPIType.CHANNEL]},
              { $eq: ['$targetId', '$$channelId'] },
              // { $gte: ['$timeframe', startOrderDate.slice(0,7) ] },
              // { $lte: ['$timeframe', endOrderDate.slice(0,7) ] },
            ]
          }
        }}
      ],
      as: 'kpis'
    }}
  ])
  console.log("channelStats", JSON.stringify(channelStats, null, 2));


  const summaryStats = (await Order.aggregate([
    { $match: {
      $expr: {
        $and: [
          { $gte: ["$orderDate", new Date(startOrderDate)] },
          { $lte: ["$orderDate", new Date(endOrderDate)] },
          { $cond: [
            { $eq: [brand, 'all'] },
            true,
            { $eq: ["$brandId", brand] }
          ]},
          { $or: [
            { $eq: [isAdmin, true] },
            { $in: ["$partnerId", partners] },
            { $in: ["$brandId", user.assignedBrands]},
          ]}
          
        ]
      }
    }},
    { $addFields: {
      totalListRevenue: {
        $sum: {
          $map: {
            input: "$items",
            as: "item",
            in: { $sum: { $multiply: ["$$item.listprice", "$$item.qty"] }}
          }
        }
      },
      totalNetRevenue: {
        $sum: {
          $map: {
            input: "$items",
            as: "item",
            in: { $sum: { $multiply: ["$$item.netprice", "$$item.qty"] }}
          }
        }
      }
    }},
    { $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalListRevenue: { $sum: "$totalListRevenue" },
      totalNetRevenue: { $sum: "$totalNetRevenue" },
    }},
    { $project: {
      _id: 0, totalOrders: 1, totalListRevenue: 1, totalNetRevenue: 1
    }}

  ]))[0] || { totalOrders: 0, totalListRevenue: 0, totalNetRevenue: 0 };
  // console.log("partners", orders);
  return { success: true, data: {totalOrders: summaryStats.totalOrders, totalListRevenue: summaryStats.totalListRevenue, totalNetRevenue: summaryStats.totalNetRevenue, totalPartners: partners.length} };

})

export default component$(() => {
  const brands = useBrands();
  const filter = useStore({ brand: 'all', timeRangeType: 'today', startDate: '', endDate: '' });
  const stats = useSignal<any>({ totalOrders: 0, totalListRevenue: 0, totalNetRevenue: 0, totalPartners: 0 });
  useTask$(async ({track, cleanup}) => {
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
      else {
        alert(res.message);
      }
    }, 500);

    cleanup(() => clearTimeout(id));
  })
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
