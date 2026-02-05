import { Schema, model, Types } from 'mongoose';
import { User } from './user.model';
import { Partner } from './partner.model';
import { Warehouse } from './warehouse.model';
import { Brand } from './brand.model';
import { Billing } from './billing.model';
const OrderSchema = new Schema({
    _id: { type: String, required: true, default: () => new Types.ObjectId().toString() },
    userId: { type: String, required: true, ref: 'users' },
    partnerId: { type: String, required: true, ref: 'partners' },
    warehouseId: { type: String, ref: 'warehouses' },
    billingId: { type: String, ref: 'billings' },
    brandId: { type: String, required: true, ref: 'brands' },
    orderDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true },
    items: [
        {
            _id: false,
            name: { type: String, required: true },
            sku: { type: String, required: true },
            qty: { type: Number, required: true },
            listprice: { type: Number, required: true },
            netprice: { type: Number, required: true },
            grossprice: { type: Number, required: true },
        }
    ],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


OrderSchema.virtual('totalNetPrice').get(function() {
    return this.items.reduce((total: number, item: any) => total + (item.netprice * item.qty), 0);
})
OrderSchema.virtual('totalGrossPrice').get(function() {
    return this.items.reduce((total: number, item: any) => total + (item.grossprice * item.qty), 0);
})

// OrderSchema.virtual('user').get(async function () {
//     const user = await User.findById(this.userId).lean();
//     return user ? user : null;
// })

// OrderSchema.virtual('partner').get(async function () {
//     const partner = await Partner.findById(this.partnerId).lean();
//     return partner ? partner : null;
// })

// OrderSchema.virtual('warehouse').get(async function () {
//     const warehouse = await Warehouse.findById(this.warehouseId).lean();
//     return warehouse ? warehouse : null;
// })

// OrderSchema.virtual('billing').get(async function () {
//     const billing = await Billing.findById(this.billingId).lean();
//     return billing ? billing : null;
// })

// OrderSchema.virtual('brand').get(async function () {
//     const brand = await Brand.findById(this.brandId).lean();
//     return brand ? brand : null;
// })

export const Order = model('orders', OrderSchema);

Order.syncIndexes().then().catch((err) => {
    console.error('Error syncing indexes for Order model:', err);
});