import { component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { LuPackage } from "@qwikest/icons/lucide";
import { Brand } from "~/models/brand.model";
import FilterBar from "~/components/products/FilterBar";

import SearchBar from "~/components/products/SearchBar";
import { verifyJWT } from "~/services/hash.service";
import { connectDB } from "~/libs/db";
import { EnumUserCustomPermission, EnumUserRole } from "~/types/common";
import { Partner } from "~/models/partner.model";
import { Order } from "~/models/order.model";
import ProductTable from "~/components/products/ProductTable";

import { isServer } from "@builder.io/qwik/build";
import ProductDetails from "~/components/products/ProductDetails";

const useBrands = routeLoader$(async function (event) {
    const brands = await Brand.aggregate([
        { $project: { _id: { $toString: "$_id" }, name: 1, createdAt: 1 } },
        { $sort: { createdAt: 1 } },
    ])
    return brands;
})

const useProducts = server$(async function (text: string = '', startDate: string = '', endDate: string = '', brand: string = 'all', sortBy: string = 'revenue-desc') {
    const auth = this.cookie.get('auth_token')?.value || '';

    const isAuth = await verifyJWT(auth);
    if (!isAuth) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectDB();

    const isAdmin = isAuth.role == EnumUserRole.DIRECTOR || isAuth.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA);

    const partners = (await Partner.aggregate([
        {
            $match: {
                $expr: {
                    $or: [
                        { $eq: [isAdmin, true] },
                        { $in: ["$channelId", isAuth.assignedChannels] }
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                _ids: { $push: { $toString: "$_id" } },
            }
        },
        { $project: { _id: 0, partners: "$_ids" } },
        { $limit: 1 }
    ]))[0]?.partners || []

    const orders = await Order.aggregate([
        {
            $match: {
                $expr: {
                    $and: [
                        {
                            $or: [
                                { $eq: [isAdmin, true] },
                                { $in: ["$partnerId", partners] },
                                { $eq: ["$userId", isAuth._id] },
                                { $eq: ["$brandId", isAuth.assignedBrands] }
                            ]
                        }, 
                        { // brand filter
                            $cond: [
                                { $eq: [brand, 'all']},
                                true,
                                { $eq: ["$brandId", brand] }
                            ]
                        },
                        { // start delivery date filter
                            $cond: [
                                { $eq: [startDate, ""] },
                                true,
                                { $gte: ["$orderDate", new Date(startDate)] }
                            ]
                        },
                        { // end delivery date filter
                            $cond: [
                                { $eq: [endDate, ""] },
                                true,
                                { $lte: ["$orderDate", new Date(endDate)] }
                            ]
                        }
                    ]
                }
            }
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$partnerId",
                totalGrossRevenue: { $sum: { $multiply: ["$items.grossprice", "$items.qty"] } },
                totalNetRevenue: { $sum: { $multiply: ["$items.netprice", "$items.qty"] } },
                items: { $push: "$items" },
            }
        },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "partners",
                localField: "_id",
                foreignField: "_id",
                as: "partner"
            }
        },
        {
            $group: {
                _id: {
                    sku: "$items.sku",
                    partnerId: "$_id"
                },
                partnerName: { $first: { $arrayElemAt: ["$partner.name", 0] } },
                name: { $first: "$items.name" },
                totalQty: { $sum: "$items.qty" },
                totalGrossRevenue: { $sum: { $multiply: ["$items.grossprice", "$items.qty"] } },
                totalNetRevenue: { $sum: { $multiply: ["$items.netprice", "$items.qty"] } },
                totalOrders: { $sum: 1 },
            }
        },
        {
            $group: {
                _id: "$_id.sku",
                sku: { $first: "$_id.sku" },
                name: { $first: "$name" },
                totalQty: { $sum: "$totalQty" },
                totalGrossRevenue: { $sum: "$totalGrossRevenue" },
                totalNetRevenue: { $sum: "$totalNetRevenue" },
                totalOrders: { $sum: "$totalOrders" },
                partners: {
                    $push: {
                        partnerId: "$_id.partnerId",
                        totalQty: "$totalQty",
                        totalGrossRevenue: "$totalGrossRevenue",
                        totalNetRevenue: "$totalNetRevenue",
                        totalOrders: "$totalOrders",
                        partnerName: "$partnerName",
                    }
                }
            }
        },
        {
            $match: {
                $or: [
                    { name: { $regex: text, $options: 'i' } },
                    { sku: { $regex: text, $options: 'i' } }
                ]
            }
        },
        // sorting
        // check sortBy value
        { $sort: 
            sortBy == 'revenue-asc' ? { totalNetRevenue: 1 } :
            sortBy == 'revenue-desc' ? { totalNetRevenue: -1 } :
            sortBy == 'qty-asc' ? { totalQty: 1 } :
            sortBy == 'qty-desc' ? { totalQty: -1 } :
            { totalNetRevenue: -1 }
        }

    ])
    // console.log('Partners:', JSON.stringify(orders));
    return { success: true, data: orders };
})

export default component$(() => {

    const filterBar = useStore({text: '', brand: 'all', startDate: "", endDate: "", sortBy: 'revenue-desc' });
    const brands = useBrands();
    const products = useSignal({ success: false, data: null as any[] | null });

    const onOpenProductDetail = useStore({ isOpen: false, product: null as any | null });

    useTask$(async ({ track, cleanup }) => {
        track(() => filterBar.brand);
        track(() => filterBar.startDate);
        track(() => filterBar.endDate);
        track(() => filterBar.sortBy);
        track(() => filterBar.text);

        // You can add additional logic here to fetch or filter products based on the filterBar and searchText values.
        // console.log('Filters updated:', { ...filterBar, searchText: searchText.value });
        // console.log('Filter Bar State:', filterBar);

        if (isServer) {
            const result = await useProducts(
                filterBar.text,
                filterBar.startDate,
                filterBar.endDate,
                filterBar.brand,
                filterBar.sortBy
            );

            products.value = { success: result.success, data: result.data ?? [] };
        }

        const id = setTimeout(async () => {
            const result = await useProducts(
                filterBar.text,
                filterBar.startDate,
                filterBar.endDate,
                filterBar.brand,
                filterBar.sortBy
            );

            products.value = { success: result.success, data: result.data ?? [] };
            
        }, 100);
        cleanup(() => clearTimeout(id));
    });

    if (onOpenProductDetail.isOpen && onOpenProductDetail.product) {
        return (<ProductDetails  product={onOpenProductDetail.product} onOpenProductDetail={onOpenProductDetail}/>)
    }
    return (
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LuPackage class="w-6 h-6 text-indigo-600" />
                        Báo Cáo Sản Phẩm
                    </h1>
                    <div class="text-sm text-gray-500">Dữ liệu tính theo Ngày lên đơn</div>
                </div>

                <div class="flex gap-2">
                    <SearchBar searchText={filterBar} />
                </div>
            </div>

            <FilterBar filterBar={filterBar} brands={brands.value} />
            <ProductTable products={products?.value.data ?? []} onOpenProductDetail={onOpenProductDetail}/>
        </div>
    )
})