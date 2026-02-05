import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate, useLocation, routeLoader$ } from "@builder.io/qwik-city";
import { Partner } from "~/models/partner.model";
import { connectDB } from "~/libs/db";
import { LuArrowLeft, LuDollarSign, LuPackage } from "@qwikest/icons/lucide";
import Header from "~/components/partners/Header";
import Metrics from "~/components/partners/Metrics";
import { EnumKPIType, EnumUserCustomPermission, EnumUserRole } from "~/types/common";
import { KPI } from "~/models/kpi.model";
import MonthlyRevenue from "~/components/partners/MonthlyRevenue";
import KPISection from "~/components/partners/KPISection";
import ItemList from "~/components/partners/ItemList";
import Notes from "~/components/partners/Notes";
const partnerDataDetails = routeLoader$(async (event) => {
    const { id } = event.params;
    const timeRange = event.query.get("timeRange") || "month";
    const user = event.sharedMap.get("user");
    let now = new Date();
    let startOfTimeRange = new Date();
    if (timeRange == "month") {
        startOfTimeRange = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange == "quarter") {
        const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
        startOfTimeRange = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    } else if (timeRange == "year") {
        startOfTimeRange = new Date(now.getFullYear(), 0, 1);
    } // 'all' thì không cần set gì cả
    await connectDB();
    let isAdmin = false
    if (user.role == EnumUserRole.DIRECTOR || user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) {
        isAdmin = true;
    }

    const partnerItemBySku = await Partner.aggregate([
        // 1. Lọc Partner ngay từ đầu (Tận dụng Index của _id)
        { $match: {_id: id} },

        // 2. Lấy danh sách đơn hàng
        { $lookup: {
            from: 'orders',
            let: { partner_id: '$_id' },
            pipeline: [
                { $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$partnerId', '$$partner_id'] },
                            { $or: [
                                { $in: [ '$brandId', user.assignedBrands ] },
                                { $eq: [ "$userId", user._id ] },
                                { $eq: [ isAdmin, true]}
                            ] },

                            { $cond: [
                                { $eq: [ timeRange, "all"] },
                                true,
                                { $gte: [ "$deliveryDate", startOfTimeRange]}
                            ]}
                        ]
                    }
                }}
            ],
            as: 'orders'
        }},

        // 3. Phẳng hóa để chạm đến từng item
        { $unwind: "$orders" },
        { $unwind: "$orders.items" },

        // 4. Gom nhóm theo SKU để tính toán các con số tổng
        { $group: {
            _id: "$orders.items.sku",
            totalQty: { $sum: "$orders.items.qty" },
            totalNetPrice: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.netprice" ] } },
            totalGrossPrice: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.grossprice" ] } },
            partnerName: { $first: "$name" } // Lấy tên partner (vì lặp lại nên dùng $first)
        }},

        // 5. Lookup sang Products để lấy thông tin bổ sung (tên sản phẩm)
        { $lookup: {
            from: 'products',
            let: { item_sku: '$_id' }, // _id lúc này chính là SKU từ group trên
            pipeline: [
                { $match: { $expr: { $eq: ['$sku', '$$item_sku' ] } } },
                { $project: { name: 1, _id: 0 } }
            ],
            as: 'productInfo'
        }},

        // 6. Dùng $addFields kết hợp $arrayElemAt để lấy tên ra luôn, không cần $unwind + $group lần nữa
        { $addFields: {
            productName: { $arrayElemAt: ["$productInfo.name", 0] }
        }},

        // 7. Làm đẹp đầu ra
        { $project: {
            sku: "$_id",
            productName: 1,
            totalQty: 1,
            totalNetPrice: 1,
            totalGrossPrice: 1,
            partnerName: 1,
            _id: 0
        }}
    ]);
    
    const partnerItemByDate = await Partner.aggregate([
        // 1. Lọc Partner ngay từ đầu (Tận dụng Index của _id)
        { $match: { _id: id } },

        // 2. Lấy danh sách đơn hàng
        { $lookup: {
            from: 'orders',
            let: { partner_id: '$_id' },
            pipeline: [
                { $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$partnerId', '$$partner_id'] },
                            { $or: [
                                { $in: [ '$brandId', user.assignedBrands ] },
                                { $eq: [ "$userId", user._id ] },
                                { $eq: [ isAdmin, true]}
                            ] },
                            { $gte: [ "$deliveryDate", new Date(now.getFullYear(), 0, 1)]}
                        ]
                    }
                }}
            ],
            as: 'orders'
        }},

        // 3. Phẳng hóa để chạm đến từng item
        { $unwind: "$orders" },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$orders.orderDate" } },
            totalOrders: { $sum: 1 },
            items: { $push: "$orders.items" }
        }},
        { $project: {
            monthYear: "$_id",
            totalOrders: 1,
            
            _id: 0,
            items: { $reduce: {
                input: "$items",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] }
            }}
        }},
        { $project: {
            monthYear: 1,
            totalOrders: 1,
            totalNetValue: { $sum: { $map: {
                input: "$items",
                as: "item",
                in: { $multiply: [ "$$item.qty", "$$item.netprice" ] }
            }}},
            totalGrossValue: { $sum: { $map: {
                input: "$items",
                as: "item",
                in: { $multiply: [ "$$item.qty", "$$item.grossprice" ] }
            }}},
            totalListValue: { $sum: { $map: {
                input: "$items",
                as: "item",
                in: { $multiply: [ "$$item.qty", "$$item.listprice" ] }
            }}}
        }}
        
    ]);

    const partnerDetails = await Partner.aggregate([
        { $match: { _id: id } },
        { $lookup: {
            from: 'orders',
            let: { partner_id: '$_id' },
            pipeline: [
                { $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$partnerId', '$$partner_id'] },
                            { $or: [
                                { $in: [ '$brandId', user.assignedBrands ] },
                                { $eq: [ "$userId", user._id ] },
                                { $eq: [ isAdmin, true]}
                            ] },

                            { $cond: [
                                { $eq: [ timeRange, "all"] },
                                true,
                                { $gte: [ "$deliveryDate", startOfTimeRange]}
                            ]}
                        ]
                    }
                }}
            ],
            as: 'orders'
        }},
        { $addFields: {
            totalOrders: { $size: "$orders"}
        }},
        { $lookup: {
            from: 'channels',
            localField: 'channelId',
            foreignField: '_id',
            as: 'channelInfo'
        }},
        { $unwind: "$orders" },
        { $unwind: "$orders.items" },
        { $group: {
            _id: null,
            id: { $first: "$_id" },
            totalOrders: { $first: "$totalOrders" },
            totalNetValue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.netprice" ] } },
            totalGrossValue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.grossprice" ] } },
            partnerName: { $first: "$name" },
            channelName: { $first: { $arrayElemAt: [ "$channelInfo.name", 0 ] } },
            totalListValue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.listprice" ] } }
        }},
        { $project: {
            _id: "$id",
            partnerName: 1,
            channelName: 1,
            totalOrders: 1,
            totalNetValue: 1,
            totalGrossValue: 1,
            totalListValue: 1
        }},
        
    ]);
    // console.log("Partner Details:", JSON.stringify(partnerDetails, null, 2));
    return { partnerItemBySku, partnerItemByDate, partnerDetails };
})

const useKPIS = routeLoader$(async (event) => {
    const { id } = event.params;
    const user = event.sharedMap.get("user");
    if (!user) {
        return [];
    }
    await connectDB();
    const Partners = await Partner.findById(id).lean();
    if (user.role != EnumUserRole.DIRECTOR && !user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA) && !user.assignedChannels.includes(Partners?.channelId!)) return []
    
    
    const kpis = await KPI.aggregate([
        { $match: { type: EnumKPIType.PARTNER, targetId: id, timeframe: { $gte: new Date().toISOString().slice(0,7) } } },
    ])

    const totalRevenueInMonth = await Partner.aggregate([
        { $match: { _id: id } },
        { $lookup: {
            from: 'orders',
            pipeline: [
                { $match: {
                    $expr: { $and: [
                        { $eq: ['$partnerId', id ] },
                        { $gte: [ "$deliveryDate", new Date(new Date().getFullYear(), new Date().getMonth(), 1) ] }
                    ]}
                }}
            ],
            as: 'orders'
        }},
        { $unwind: "$orders" },
        { $unwind: "$orders.items" },
        { $group: {
            _id: null,
            totalNetRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.netprice" ] } },
            totalGrossRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.grossprice" ] } },
            totalListRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.listprice" ] } }
        }},
        { $project: {
            _id: 0,
            totalNetRevenue: 1,
            totalGrossRevenue: 1,
            totalListRevenue: 1
        }}

    ])

    const totalRevenueInQuarter = await Partner.aggregate([
        { $match: { _id: id } },
        { $lookup: {
            from: 'orders',
            pipeline: [
                { $match: {
                    $expr: { $and: [
                        { $eq: ['$partnerId', id ] },
                        { $gte: [ "$deliveryDate", new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)] }
                    ]}
                }}
            ],
            as: 'orders'
        }},
        { $unwind: "$orders" },
        { $unwind: "$orders.items" },
        { $group: {
            _id: null,
            totalNetRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.netprice" ] } },
            totalGrossRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.grossprice" ] } },
            totalListRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.listprice" ] } }
        }},
        { $project: {
            _id: 0,
            totalNetRevenue: 1,
            totalGrossRevenue: 1,
            totalListRevenue: 1
        }}

    ])
    const totalRevenueInYear = await Partner.aggregate([
        { $match: { _id: id } },
        { $lookup: {
            from: 'orders',
            pipeline: [
                { $match: {
                    $expr: { $and: [
                        { $eq: ['$partnerId', id ] },
                        { $gte: [ "$deliveryDate", new Date(new Date().getFullYear(), 0, 1)] }
                    ]}
                }}
            ],
            as: 'orders'
        }},
        { $unwind: "$orders" },
        { $unwind: "$orders.items" },
        { $group: {
            _id: null,
            totalNetRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.netprice" ] } },
            totalGrossRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.grossprice" ] } },
            totalListRevenue: { $sum: { $multiply: [ "$orders.items.qty", "$orders.items.listprice" ] } }
        }},
        { $project: {
            _id: 0,
            totalNetRevenue: 1,
            totalGrossRevenue: 1,
            totalListRevenue: 1
        }}

    ])
    // console.log("Partners KPI:", JSON.stringify(kpis, null, 2));
    const monthKPIs = kpis.filter(kpi => kpi.period === 'MONTH');
    const quarterKPIs = kpis.filter(kpi => kpi.period === 'QUARTER');
    const yearKPIs = kpis.filter(kpi => kpi.period === 'YEAR');

    let monthNetRevenue = totalRevenueInMonth[0]?.totalNetRevenue || 0;
    
    
    monthKPIs.sort((a, b) => a.amount - b.amount).map(kpi => {
        if (kpi.amount <= monthNetRevenue) {
            kpi.process = 1;
            monthNetRevenue -= kpi.amount;
        }
        else {
            kpi.process = (monthNetRevenue / kpi.amount);
            monthNetRevenue = 0;
        }
    });

    let quarterNetRevenue = totalRevenueInQuarter[0]?.totalNetRevenue || 0;
    quarterKPIs.sort((a, b) => a.amount - b.amount).map(kpi => {
        if (kpi.amount <= quarterNetRevenue) {
            kpi.process = 1;
            quarterNetRevenue -= kpi.amount;
        }
        else {
            kpi.process = (quarterNetRevenue / kpi.amount);
            quarterNetRevenue = 0;
        }
    });
    let yearNetRevenue = totalRevenueInYear[0]?.totalNetRevenue || 0;
    yearKPIs.sort((a, b) => a.amount - b.amount).map(kpi => {
        if (kpi.amount <= yearNetRevenue) {
            kpi.process = 1;
            yearNetRevenue -= kpi.amount;
        }
        else {
            kpi.process = (yearNetRevenue / kpi.amount);
            yearNetRevenue = 0;
        }
    });
    // console.log("Month KPIs:", JSON.stringify(yearKPIs, null, 2));
    return {month: monthKPIs, quarter: quarterKPIs, year: yearKPIs};

})

const useNotes = routeLoader$(async (event) => {
    const { id } = event.params;
    await connectDB();
    const notes = await Partner.aggregate([
        { $match: { _id: id } },
        { $unwind: "$notes" },
        { $project: {
            _id: 0,
            date: "$notes.date",
            content: "$notes.content",
            userId: "$notes.userId"
        }},
        { $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo"
        }},
        { $addFields: {
            userName: { $arrayElemAt: [ "$userInfo.name", 0 ] }
        }},
        { $project: {
            date: 1,
            content: 1,
            userId: 1,
            userName: 1
        }},
        { $sort: { date: 1}}
        


    ]);
    // console.log("Partner Notes:", JSON.stringify(notes, null, 2));
    return notes || [];
})

const useCurrentUser = routeLoader$(async (event) => {
    const user = event.sharedMap.get("user");
    return user;
})
export default component$(() => {
    const nav = useNavigate();
    // const loc = useLocation();
    const partner = partnerDataDetails();
    const kpis = useKPIS();
    const currentUser = useCurrentUser();
    const notes = useNotes();

    const timeRange = useSignal("month")
    // console.log("Partner Data Details:", JSON.stringify(partner.value, null, 2));
    return (
        <div class="space-y-6 animate-fade-in relative">
            <button onClick$={async () => await nav('/dashboard/partners')} class="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
                Quay lại danh sách
            </button>
            <Header partner={partner.value.partnerDetails[0]} timeRange={timeRange} />
            <Metrics stats={partner.value.partnerDetails[0]} currentUser={currentUser.value} kpis={kpis.value} />

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <KPISection kpis={kpis.value} />
                    <MonthlyRevenue orders={partner.value.partnerItemByDate} />
                    <ItemList items={partner.value.partnerItemBySku} />
                </div>
                <Notes notes={notes.value} partnerId={partner.value.partnerDetails[0]._id} />
            </div>
        </div>
    )
})