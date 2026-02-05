import { component$ } from '@builder.io/qwik';
import { LuShield as Shield } from '@qwikest/icons/lucide';
import { EnumUserRole, InterfaceBrand, InterfaceChannel } from '~/types/common';

import { useNavigate } from '@builder.io/qwik-city';

interface Props {
  users: any[];
  modelEditUser: any;
}

export default component$(({ users, modelEditUser }: Props) => {
  const nav = useNavigate();
  return (
    <div class="lg:col-span-2 space-y-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phạm vi gán</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Quyền</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr class="hover:bg-gray-50 transition-colors" key={user.username}>
                <td class="px-6 py-4">
                  <div class="text-sm font-bold text-gray-900">{user.name}</div>
                  <div class="text-xs text-gray-500">{user.email} • {user.role}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    {user.role == EnumUserRole.DIRECTOR ? (
                      <span class="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">ALL ACCESS</span>
                    ) : (
                      <>
                        {user.assignedChannels?.map((c: InterfaceChannel) => <span key={c._id} class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{c.name}</span>)}
                        {user.assignedBrands?.map((brand: InterfaceBrand) => <span key={brand._id} class="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">{brand.name}</span>)}
                        {!user.assignedChannels?.length && !user.assignedBrands?.length && <span class="text-[10px] text-gray-400">Trống</span>}
                      </>
                    )}
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button onClick$={() => (modelEditUser.value = {open: true, user})} class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Shield class="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
