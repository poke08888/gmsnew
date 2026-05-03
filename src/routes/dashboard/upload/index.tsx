import { component$, useSignal, $ } from '@builder.io/qwik';
import { Form, routeLoader$, server$ } from '@builder.io/qwik-city';
import { LuUpload as UploadIcon } from '@qwikest/icons/lucide';
import Error from '~/components/upload/Error';
import OrderInfo from '~/components/upload/OrderInfo';
import FileDropzone from '~/components/upload/FileDropzone';
import OrderTable from '~/components/upload/OrderTable';
import { connectDB } from '~/libs/db';
import { Partner } from '~/models/partner.model';
import { Warehouse } from '~/models/warehouse.model';
import { Billing } from '~/models/billing.model';
import { Channel } from '~/models/channel.model';
import { Order } from '~/models/order.model';
import { Product } from '~/models/product.model';
import { InterfacePartner, InterfaceBrand, InterfaceUser, InterfaceOrder, InterfaceOrderItem, EnumUserRole } from '~/types/common';
import { User } from '~/models/user.model';
import { verifyJWT } from '~/services/hash.service';
import { Brand } from '~/models/brand.model';
const usePartners = routeLoader$(async () => {
    await connectDB();
    const partners = await Partner.find({}, { __v: 0 }).populate('warehouses billings channelId').lean();
    return partners as unknown as InterfacePartner[];
})

const useBrands = routeLoader$(async () => {
    await connectDB();
    const brands = await Brand.find({}, { __v: 0 }).lean();
    return brands as unknown as InterfaceBrand[];
})

const useUsers = routeLoader$(async ({sharedMap}) => {
    const session = sharedMap.get('session');
        if (!session) {
            return [];
        }

        const user = await User.findOne({ _id: session.user._id });
        if (!user) {
            return [];
        }
    await connectDB();
    if (user.role == EnumUserRole.DIRECTOR) {
        const users = await User.find({}, { __v: 0 }).lean();
        return users as unknown as InterfaceUser[];
    } else {
        const users = await User.find({_id: user._id}, { __v: 0 }).lean();
        return users as unknown as InterfaceUser[];
    }
})

const addOrder = server$(async function (orderData: InterfaceOrder) {
    try {
        const session = this.sharedMap.get('session');
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await User.findOne({ _id: session.user._id });
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }
        // console.log('Adding order for user:', user);

        let threeDayBefore = (new Date()).setDate((new Date()).getDate() - 3);
        if (new Date(orderData.orderDate).getTime() < threeDayBefore) {
            return { success: false, error: 'Order date không thể cách ngày hiện tại hơn 3 ngày' };
        }

        if (new Date(orderData.deliveryDate).getTime() < new Date(orderData.orderDate).getTime()) {
            return { success: false, error: 'Ngày giao hàng không thể trước ngày đặt hàng' };
        }

        // Check xem ngày giao hàng có phải là ngày trong quá khứ không, tối thiểu phải là ngày hôm nay
        let today = (new Date()).setHours(0, 0, 0, 0);
        if (new Date(orderData.deliveryDate).setHours(0, 0, 0, 0) < today) {
            return { success: false, error: 'Ngày giao hàng không thể là ngày trong quá khứ' };
        }


        await connectDB();
        
        const brand = await Brand.findOne({_id: orderData.brandId})
        let brand_short = brand?.name.length! >= 2 ? brand?.name.slice() : brand?.name;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateString = `${yyyy}${mm}${dd}`;
        let randomNumber = Math.floor(100000 + Math.random() * 900000);
        let orderCode = `${brand_short}${dateString}${randomNumber}`;
        while (true) {
            let exist = await Order.findOne({orderCode: orderCode})
            if (exist) {
                randomNumber = Math.floor(100000 + Math.random() * 900000);
                orderCode = `${brand_short}${dateString}${randomNumber}`;
                continue;
            }
            break;
        }

        const newOrder = new Order({
            ...orderData,
            userId: orderData.userId,
            orderCode: orderCode
        })
        await newOrder.save();

        const items = orderData.items || [];
        for (const item of items) {
            let product = await Product.findOne({ sku: item.sku });
            if (!product) {
                product = new Product({
                    sku: item.sku,
                    name: item.name
                })
            await product.save();
            }
            product.orders.push(newOrder._id);
            await product.save();
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error adding order:', error);
        return { success: false, error: error.message };
    }
})

export default component$(() => {
    const error = useSignal('');
    const orderData = useSignal({partnerId: '', warehouseId: '', billingId: '', brandId: '', userId: '', name: '', orderDate: '', deliveryDate: '', items: []});
    const partners = usePartners();
    const brands = useBrands();
    const users = useUsers();
    const file = useSignal<{items: InterfaceOrderItem[], rawFile: File | null}>({items: [], rawFile: null});

    const handleClear = $(() => {
        file.value = {items: [], rawFile: null};
    })

    const handleSubmit = $(async () => {
        error.value = '';
        const orderSubmit: InterfaceOrder = {
            partnerId: orderData.value.partnerId,
            warehouseId: orderData.value.warehouseId,
            billingId: orderData.value.billingId,
            brandId: orderData.value.brandId,
            name: orderData.value.name,
            orderDate: new Date(orderData.value.orderDate),
            deliveryDate: new Date(orderData.value.deliveryDate),
            items: file.value.items,
            userId: orderData.value.userId,
        }
        const result = await addOrder(orderSubmit);
        if (!result.success) {
            error.value = result.error || 'Lỗi không xác định';
            return;
        }
        alert('Đơn hàng đã được thêm thành công!');
        orderData.value = {name: "", partnerId: '', warehouseId: '', billingId: '', brandId: '', userId: '', orderDate: '', deliveryDate: '', items: []};
        file.value = {items: [], rawFile: null};
    })

    return (
        <div class="max-w-3xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div class="bg-indigo-600 px-6 py-4">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2"><UploadIcon class="w-6 h-6" />Upload Đơn Hàng</h2>
                    <p class="text-indigo-100 text-sm mt-1">Nhập dữ liệu bán hàng từ file Excel/CSV</p>
                </div>

                <div class="p-8 space-y-6">
                    <Error error={error} />

                    <OrderInfo partners={partners.value} orderData={orderData} brands={brands.value} users={users.value} />
                    <OrderTable file={file} />
                    <FileDropzone file={file} />
                    <div class="flex justify-end space-x-4">
                        <button onClick$={handleClear} class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">Xóa</button>
                        <button onClick$={handleSubmit} class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium">Lưu tất cả thay đổi</button>
                    </div>
                </div>
            </div>

        </div>
    )
})