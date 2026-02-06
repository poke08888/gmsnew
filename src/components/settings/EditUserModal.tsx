import { component$, useSignal } from '@builder.io/qwik';
import { $ } from '@builder.io/qwik';
import { server$, useNavigate } from '@builder.io/qwik-city';
import { LuX as X, LuBriefcase as Briefcase, LuTag as Tag, LuShield as Shield, LuCheckCircle as CheckCircle } from '@qwikest/icons/lucide';
import { model } from 'mongoose';
import { GetUserById, UpdateUserEmail, UpdateUserName, UpdateUserPassword, UpdateUserPermissions, UpdateUserRole, UpdateUserUsername } from '~/services/user.service';
import type { InterfaceChannel, InterfaceBrand, InterfaceUser } from '~/types/common';
import { EnumUserCustomPermission, EnumUserRole } from '~/types/common';
import { verifyJWT } from '~/services/hash.service';
interface Props {
  modelEditUser: any;
  channels: InterfaceChannel[];
  brands: InterfaceBrand[];
}

const UpdateUserPermission = server$(async function (user: InterfaceUser) {
  const auth_token = this.cookie.get('auth_token')?.value || '';
  const authUser = await verifyJWT(auth_token);
  if (!authUser || (authUser.role !== EnumUserRole.DIRECTOR)) {
    // console.log('Unauthorized attempt to update user permissions.');
    return {success: false, message: 'Unauthorized.'};
    // throw new Error('Unauthorized');
  }
  // console.log('Updating user permissions for:', user);

  if (!user._id) {

    return {success: false, message: 'User ID cis required for updating permissions.'};
    // throw new Error('User ID is required for updating permissions.');
  }

  const userExist = await GetUserById(user._id);
  if (!userExist) {
    return {success: false, message: 'User not found.'};
    // throw new Error('User not found.');
  }

  if (user.name !== userExist.name) {
    // return;
    await UpdateUserName(user._id, user.name);
  }

  if (user.username !== userExist.username) {
    const usernameUpdated = await UpdateUserUsername(user._id, user.username);
    if (!usernameUpdated) {
      return {success: false, message: 'Username already exists.'};
      // throw new Error('Username already exists.');
    }
  }

  if (user.email !== userExist.email) {
    const emailUpdated = await UpdateUserEmail(user._id, user.email);
    if (!emailUpdated) {
      return {success: false, message: 'Email already exists.'};
      // throw new Error('Email already exists.');
    }
  }

  if (user.role !== userExist.role) {
    await UpdateUserRole(user._id, user.role);
  }

  if (user.password && user.password.trim() !== '') {
    await UpdateUserPassword(user._id, user.password);
  }

  await UpdateUserPermissions(user._id, user.assignedChannels, user.assignedBrands, user.customPermissions || []);
  
  return {success: true}

})

export default component$(({ modelEditUser, channels, brands }: Props) => {

  const navigate = useNavigate();
  if (!modelEditUser.value.open) return null;

  const user = modelEditUser.value.user;

  const handleUpdateUserPermission = $(async () => {

    await UpdateUserPermission(modelEditUser.value.user);
    modelEditUser.value = { open: false, user: null };
    await navigate();
  })

  return (
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
        <div class="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div>
            <h2 class="text-xl font-bold">Quyền Hạn: {modelEditUser.value.user?.name}</h2>
            <p class="text-xs text-indigo-100 mt-1 uppercase tracking-widest font-semibold">{modelEditUser.value.user?.role}</p>
          </div>
          <button onClick$={() => (modelEditUser.value = {open: false, user: null})} class="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"><X class="w-6 h-6" /></button>
        </div>

        <div class="p-8 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
          <section class="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 class="text-sm font-bold text-gray-700 mb-3 text-indigo-600">THÔNG TIN NGƯỜI DÙNG</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input type="text" value={user?.name || ''} onChange$={(e) => user && (user.name = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={user?.email || ''} onChange$={(e) => user && (user.email = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input type="text" value={user?.username || ''} onChange$={(e) => user && (user.username = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <select value={user?.role || ''} onChange$={(e) => user && (user.role = (e.target as HTMLSelectElement).value as any)} class="w-full rounded-lg border-gray-300 border p-2 outline-none">
                    {Object.values(EnumUserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu (để trống nếu không đổi)</label>
                  <input type="password" value={user.password} onChange$={(e) => (user.password = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 outline-none" placeholder="Không hiện mật khẩu đã hash" />
                </div>
            </div>
          </section>
          <section>
            <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 text-indigo-600 border-b pb-2"><Briefcase class="w-4 h-4" /> PHẠM VI KÊNH</h4>
            <div class="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <button key={channel._id} onClick$={() => {
                  const current = modelEditUser.value.user?.assignedChannels || [];
                  const updated = current.includes(channel) ? current.filter((x: InterfaceChannel) => x._id != channel._id) : [...current, channel];
                //   modelEditUser.value.user?.assignedChannels = updated;
                  modelEditUser.value = { ...modelEditUser.value, user: { ...modelEditUser.value.user, assignedChannels: updated } };
                }}
                class={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${modelEditUser.value.user?.assignedChannels?.some((x: InterfaceChannel) => x._id == channel._id) ? 'bg-orange-50 border-orange-600 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >{channel.name}</button>
              ))}
            </div>
          </section>

          <section>
            <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 text-indigo-600 border-b pb-2"><Tag class="w-4 h-4" /> PHẠM VI THƯƠNG HIỆU</h4>
            <div class="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <button key={brand._id} onClick$={() => {
                  const current = modelEditUser.value?.user.assignedBrands || [];
                  const updated = current.includes(brand) ? current.filter((x: InterfaceBrand) => x._id != brand._id) : [...current, brand];
                  modelEditUser.value = { ...modelEditUser.value, user: { ...modelEditUser.value.user, assignedBrands: updated } };
                }}
                class={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${modelEditUser.value.user.assignedBrands?.some((x: InterfaceBrand) => x._id == brand._id) ? 'bg-orange-50 border-orange-600 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >{brand.name}</button>
              ))}
            </div>
          </section>

          <section class="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 text-indigo-600"><Shield class="w-4 h-4" /> QUYỀN ĐẶC BIỆT</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    {id: EnumUserCustomPermission.VIEW_ALL_DATA, label: 'Xem toàn bộ dữ liệu'} as any,
                    {id: EnumUserCustomPermission.EXPORT_DATA, label: 'Quyền xuất Excel'} as any,
                    {id: EnumUserCustomPermission.MANAGE_PARTNERS, label: 'Quyền sửa Đối tác'} as any,
                    {id: EnumUserCustomPermission.MANAGE_KPIS, label: 'Quyền thiết lập KPI'} as any
                ].map(permission => (
                    <label key={permission.id} class="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={modelEditUser.value.user?.customPermissions?.includes(permission.id)} onChange$={() => {
                            const current = modelEditUser.value.user?.customPermissions || [];
                            const updated = current.includes(permission.id) ? current.filter((p: string) => p != permission.id) : [...current, permission.id];
                            // modelEditUser.value.user.customPermissions = updated;
                            modelEditUser.value = { ...modelEditUser.value, user: { ...modelEditUser.value.user, customPermissions: updated } };
                            // console.log(modelEditUser.value.user.customPermissions);
                        }} class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                        <span class="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{permission.label}</span>
                    </label>
                ))}
              </div>
          </section>
        </div>

        <div class="p-6 bg-gray-50 border-t flex justify-end gap-3">
            <button onClick$={() => modelEditUser.value = {open: false, user: null}} class="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">HỦY</button>
            <button onClick$={handleUpdateUserPermission} class="px-10 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                <CheckCircle class="w-5 h-5" /> LƯU THAY ĐỔI
            </button>
        </div>
      </div>
    </div>
  );
});
