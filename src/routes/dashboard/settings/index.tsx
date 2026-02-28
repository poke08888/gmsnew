import { LuUsers as Users, LuBuilding as Building, LuTarget as Target, LuShield as Shield } from '@qwikest/icons/lucide';

import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, server$, type DocumentHead, zod$, z } from '@builder.io/qwik-city';

import { verifyJWT } from '~/services/hash.service';
import { EnumUserCustomPermission, EnumUserRole, InterfaceBrand } from '~/types/common';
import { CreateUser, GetUserById, UpdateUserEmail, UpdateUserName, UpdateUserPassword, UpdateUserPermissions, UpdateUserRole, UpdateUserUsername } from '~/services/user.service';
import { User } from '~/models/user.model';
import { Channel } from '~/models/channel.model';
import { InterfaceUser, InterfaceChannel, InterfacePartner, InterfaceKPI } from '~/types/common';
import { connectDB } from '~/libs/db';
import { Brand } from '~/models/brand.model';
import { Partner } from '~/models/partner.model';
import { Warehouse } from '~/models/warehouse.model';
import { Billing } from '~/models/billing.model';
import { KPI } from '~/models/kpi.model';
import CreateUserForm from '~/components/settings/CreateUserForm';
import UsersTable from '~/components/settings/UsersTable';
import EditUserModal from '~/components/settings/EditUserModal';
import PartnersTable from '~/components/settings/PartnersTable';
import MenuPanel from '~/components/settings/MenuPanel';
import PartnerPanel from '~/components/settings/PartnerPanel';
import KPISetion from '~/components/settings/KPISetion';
import { useNavigate } from '@builder.io/qwik-city';
import BrandSection from '~/components/settings/BrandSection';
import ChannelSection from '~/components/settings/ChannelSection';

const useUsers = routeLoader$(async () => {
    await connectDB();
    const users = await User.find({}, { password: 0, __v: 0 }).populate('assignedBrands assignedChannels').lean();
    return users as unknown as InterfaceUser[];
})

const useChannels = routeLoader$(async () => {
    await connectDB();
    const channels = await Channel.find({}, { __v: 0 }).lean();
    return channels as InterfaceChannel[];
})

const useBrands = routeLoader$(async () => {
    await connectDB();
    const brands = await Brand.find({}, { __v: 0 }).lean();
    return brands as InterfaceBrand[];
})

const usePartners = routeLoader$(async () => {
    await connectDB();
    const partners = await Partner.find({}, { __v: 0 }).populate('warehouses billings channelId').lean();
    return partners as unknown as InterfacePartner[];
})

const useKPIs = routeLoader$(async () => {
    await connectDB();
    const kpis = await KPI.find({}, { __v: 0 }).lean();
    return kpis as unknown as InterfaceKPI[];

})

export const useAddUser = routeAction$(async (data, {sharedMap}) => {
    const session = sharedMap.get('session');
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    if (user.role !== EnumUserRole.DIRECTOR) {
        return { success: false, error: 'Unauthorized' };
    }
    
    const { username, password, role, email, name } = data;
    const success = await CreateUser(username, password, name, email, role as EnumUserRole);
    if (!success) {
        return { success: false,  error: 'User/Email already exists' };
    }
    return { success: true };
}, zod$({
    username: z.string(),
    password: z.string(),
    role: z.string(),
    email: z.string(),
    name: z.string(),
}))

export const useUpdateUser = routeAction$(async (data, {sharedMap}) => {
    const session = sharedMap.get('session');
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    if (user.role !== EnumUserRole.DIRECTOR) {
        return { success: false, error: 'Unauthorized' };
    }

    const { _id, username, password, role, email, name, assignedChannels, assignedBrands, customPermissions } = data;

    const userToUpdate = await GetUserById(_id);

    if (!userToUpdate) {
        return {success: false, message: 'User not found.'};
    }

    if (userToUpdate.username !== username) {
        await UpdateUserUsername(userToUpdate._id, username);
    }

    if (userToUpdate.name !== name) {
        await UpdateUserName(userToUpdate._id, name);
    }

    if (userToUpdate.email !== email) {
        await UpdateUserEmail(userToUpdate._id, email);
    }

    if (userToUpdate.role !== role) {
        await UpdateUserRole(userToUpdate._id, role);
    }

    if (password && password.trim() !== '') {
        await UpdateUserPassword(userToUpdate._id, password);
    }

    await UpdateUserPermissions(userToUpdate._id, assignedChannels as unknown as InterfaceChannel[], assignedBrands as unknown as InterfaceBrand[], customPermissions as unknown as EnumUserCustomPermission[] || []);
    
    return { success: true };
    
}, zod$({
    _id: z.string(),
    username: z.string(),
    password: z.string().optional(),
    role: z.string(),
    email: z.string(),
    name: z.string(),
    assignedChannels: z.object({}).passthrough().array(),
    assignedBrands: z.object({}).passthrough().array(),
    customPermissions: z.array(z.string()),
}))


export const head: DocumentHead = {
    title: "Cài đặt hệ thống - GMS",
    meta: [
        {
            name: "description",
            content: "Trang cài đặt hệ thống quản lý GlowMe",
        },
    ],
};

export default component$(() => {
    const users = useUsers();   
    const modelEditUser = useSignal({open: false, user: null as any});
    // console.log(users.value);
    const partners = usePartners();
    const channels = useChannels();
    const brands = useBrands();
    const kpis = useKPIs();
    const nav = useNavigate();
    const activeTab = useSignal('users');
    const addUserAction = useAddUser();
    const addUserData = useSignal({name: '', username: '', password: '', role: EnumUserRole.STAFF, email: '', success: false, error: ''})
    const handleAddUser = $(async () => {

        const result = await addUserAction.submit({ username: addUserData.value.username, 
            password: addUserData.value.password, 
            role: addUserData.value.role,
            email: addUserData.value.email,
            name: addUserData.value.name,
        });
        if (result?.value.success) {
            // alert('Người dùng đã được tạo thành công');
            addUserData.value = {name: '', username: '', password: '', role: EnumUserRole.STAFF, email: '', success: true, error: ''};
        } else {
            alert('Lỗi khi tạo người dùng: ' + result?.value.error);
            addUserData.value.success = false;
            addUserData.value.error = result?.value.error || 'Lỗi không xác định';
        }
    })

    const modalPartnerData = useSignal({open: false, partner: null as any});
    return (
        <div class="space-y-6 animate-fade-in pb-20">
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield class="w-7 h-7 text-indigo-600" />
                Hệ Thống Quản Trị GMS
            </h1>
            < MenuPanel activeTab={activeTab}/>

            {activeTab.value == 'users' && (
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <CreateUserForm addUserData={addUserData} handleAddUser={handleAddUser} />
                    <UsersTable users={users.value} modelEditUser={modelEditUser} />
                </div>
            )}
            <EditUserModal modelEditUser={modelEditUser} channels={channels.value} brands={brands.value}/>
            {activeTab.value == 'partners' && (
                <PartnersTable modalPartnerData={modalPartnerData} partners={partners.value} />
            )}
            {modalPartnerData.value.open && (
                <PartnerPanel modalPartnerData={modalPartnerData} channels={channels.value} />
            )}

            {activeTab.value == 'kpis' && (
                <KPISetion channels={channels.value} users={users.value} partners={partners.value} kpis={kpis.value} />
            )}
            {activeTab.value == 'brands' && (
                <BrandSection brands={brands.value} />
            )}
            {activeTab.value == 'channels' && (
                <ChannelSection channels={channels.value} />
            )}


        </div>
    )
})