// import { ObjectId } from "mongoose";

export enum EnumUserRole {
    STAFF = 'Nhân viên',
    SUP = 'Sup',
    DIRECTOR = 'Giám đốc'
}

export enum EnumUserCustomPermission {
    VIEW_ALL_DATA = 'view_all_data',
    EXPORT_DATA = 'export_data',
    MANAGE_PARTNERS = 'manage_partners',
    MANAGE_KPIS = 'manage_kpis'
}

export interface InterfaceBrand {
    _id: string;
    name: string;
}

export interface InterfaceChannel {
    _id: string;
    name: string;
}

export interface InterfaceUser {
    _id: string;
    username: string;
    name: string;
    email: string;
    password: string;
    role: EnumUserRole;
    assignedChannels: InterfaceChannel[];
    assignedBrands: InterfaceBrand[];
    customPermissions: EnumUserCustomPermission[];
}

export interface InterfaceWarehouse {
    _id: string;
    name: string;
    location: string;
    contactName: string;
    contactPhone: string;
}

export interface InterfaceBilling {
    _id: string;
    name: string;
    location: string;
    taxNumber: string;
}

export interface InterfacePartner {
    _id: string;
    channelId?: InterfaceChannel;
    name: string;
    warehouses: InterfaceWarehouse[];
    billings: InterfaceBilling[];
}

export enum EnumKPIType {
    CHANNEL = 'Channel',
    USER = 'User',
    PARTNER = 'Partner'
}

export interface InterfaceKPI {
    _id: string;
    type: EnumKPIType;
    targetId: string;
    period: string;
    timeframe: string;
    amount: number;
}

export interface InterfaceOrderItem {
    sku: string;
    name: string;
    qty: number;
    listprice: number;
    netprice: number;
    grossprice: number;
}


export interface InterfaceOrder {
    _id?: string;
    userId?: InterfaceUser | string;
    partnerId: InterfacePartner | string;
    warehouseId: InterfaceWarehouse | null | string;
    totalNetPrice?: number;
    totalGrossPrice?: number;
    billingId: InterfaceBilling | null | string;
    brandId: InterfaceBrand | null | string;
    orderCode?: string;
    name?: string;
    orderDate: Date;
    deliveryDate: Date;
    items: InterfaceOrderItem[];
}