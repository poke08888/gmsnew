//@ts-nocheck
import { component$, useSignal, useStore, useTask$ } from '@builder.io/qwik';
import { server$, routeLoader$, useNavigate } from '@builder.io/qwik-city';
import Filters from '~/components/orders/Filters';
import OrderListTable from '~/components/orders/OrderListTable';
import Pagination from '~/components/orders/Pagination';
import InvoicePreview from '~/components/orders/InvoicePreview';
import OrderSlipPreview from '~/components/orders/OrderSlipPreview';
import InvoiceEdit from '~/components/orders/InvoiceEdit';
import { LuFileText as FileText, LuRefreshCw as RefreshCw } from '@qwikest/icons/lucide';
import { connectDB } from '~/libs/db';
import { Channel } from '~/models/channel.model';
import { Partner } from '~/models/partner.model';
import { EnumUserCustomPermission, EnumUserRole, InterfaceChannel, InterfacePartner, InterfaceUser, InterfaceOrder } from '~/types/common';
import { User } from '~/models/user.model';
import { verifyJWT } from '~/services/hash.service';
import { Order } from '~/models/order.model';

const usePartners = routeLoader$(async ({cookie}) => {

    await connectDB();
    const partners = await Partner.find({}, { __v: 0 }).lean();
    return partners as unknown as InterfacePartner[];
})

const useUsers = routeLoader$(async ({cookie, sharedMap}) => {
    const user = sharedMap.get('user');
    if (user?.role! == EnumUserRole.DIRECTOR || user?.customPermissions!.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) {
        await connectDB();
        const users = await User.find({}, { __v: 0 }).lean();
        return users as unknown as InterfaceUser[];
    }
    await connectDB();
    const users = await User.find({_id: user._id}, { __v: 0 }).lean();
    return users as unknown as InterfaceUser[];
})

const useCurrentUser = routeLoader$(async ({cookie, sharedMap}) => {
    return sharedMap.get('user') as InterfaceUser;
})

const useOrders = server$(async function(page: number, limit: number, search: { text: string, partnerId: string, userId: string, startDate: string, endDate: string, sortBy?: string }) {
    const session = this.sharedMap.get('session');
    if (!session) {
        return { orders: [], total: 0 };
    }

    const user = await User.findOne({ _id: session.user._id });
    if (!user) {
        return { orders: [], total: 0 };
    }
    // const user = isValid as InterfaceUser;

    const skip = (page - 1) * limit;
    const filterOperations: any = {}
    if (user?.role != EnumUserRole.DIRECTOR && !user?.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) {
        filterOperations.userId = user?._id;
    }
    if (search.text) {
        filterOperations.$or = [
            { orderCode: { $regex: search.text, $options: 'i' } }
        ]
    }
    // if (search.channelId && search.channelId != 'all') {
    //     filterOperations.channelId = search.channelId
    // }
    if (search.partnerId && search.partnerId != 'all') {
        filterOperations.partnerId = search.partnerId
    }
    if (search.userId && search.userId != 'all') {
        filterOperations.userId = search.userId
    }
    if (search.startDate) {
        filterOperations.orderDate = { $gte: new Date(search.startDate) }
    }
    if (search.endDate) {
        // if (!filterOperations.deliveryDate) {
        //     filterOperations.deliveryDate = {}
        // }
        filterOperations.orderDate.$lte = new Date(search.endDate)
    }
    // sort order mapping
    let sort: any = { orderDate: -1 };
    const sortBy = search.sortBy || 'orderDate-desc';
    if (sortBy === 'orderDate-asc') sort = { orderDate: 1 };
    else if (sortBy === 'orderDate-desc') sort = { orderDate: -1 };
    else if (sortBy === 'deliveryDate-asc') sort = { deliveryDate: 1 };
    else if (sortBy === 'deliveryDate-desc') sort = { deliveryDate: -1 };
    else if (sortBy === 'revenue-asc') sort = { totalNetPrice: 1 };
    else if (sortBy === 'revenue-desc') sort = { totalNetPrice: -1 };

    let orders = await Order.find(filterOperations, { __v: 0 }).populate('userId partnerId warehouseId billingId brandId').skip(skip).limit(limit).sort(sort) as any[];
    orders = orders.map(order => order.toJSON()) as InterfaceOrder[];
    // console.log('filterOperations', filterOperations);
    const total = await Order.countDocuments(filterOperations);
    return {orders, total} as { orders: InterfaceOrder[], total: number };
})


export default component$(() => {
    const nav = useNavigate()
    const partners = usePartners()
    const users = useUsers()
    const search = useStore<{ text: string, partnerId: string, userId: string, startDate: string, endDate: string, sortBy?: string }>({ text: '', partnerId: 'all', userId: 'all', startDate: '', endDate: '', sortBy: 'orderDate-desc' }, {deep: true});
    const orders = useStore<{ orders: InterfaceOrder[], total: number }>({ orders: [], total: 0 });
    const page = useSignal(1);
    const limit = useSignal(10);
    const currentUser = useCurrentUser();
    const handleOrderAction = useStore<{action: string, order: InterfaceOrder | null }>({ action: '', order: null });
    useTask$(async ({track}) => {
        track(() => search.text);
        track(() => search.partnerId);
        track(() => search.userId);
        track(() => search.startDate);
        track(() => search.endDate);
        track(() => search.sortBy);
        track(() => page.value);
        track(() => limit.value);
        const ordersData = await useOrders(page.value, limit.value, search);
        orders.orders = ordersData.orders
        orders.total = ordersData.total
    })
    return (
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText class="w-6 h-6 text-indigo-600" />Quản Lý Đơn Hàng
                    </h1>
                    <p class="text-sm text-gray-500">Hiển thị đơn hàng trong phạm vi quyền hạn của bạn.</p>
                </div>
                <button onClick$={async () => {await nav('/dashboard/upload')}} class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                    <RefreshCw class="w-4 h-4"/> Upload Mới
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Filters search={search} partners={partners.value} users={users.value}/>
                <OrderListTable currentUser={currentUser.value} ordersData={orders} orderAction={handleOrderAction} sortBy={search.sortBy} onSortChange$={(s: string) => { search.sortBy = s; }} />
                <Pagination total={orders.total} page={page} limit={limit} />
            </div>
            {handleOrderAction.action == "preview" && <InvoicePreview orderAction={handleOrderAction} />}
            {handleOrderAction.action == "order-slip" && <OrderSlipPreview orderAction={handleOrderAction} />}
            {handleOrderAction.action == 'edit' && <InvoiceEdit orderAction={handleOrderAction} />}
        </div>
    )
})
