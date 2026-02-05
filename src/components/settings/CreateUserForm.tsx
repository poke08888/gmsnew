import { component$ } from '@builder.io/qwik';
import { Form, useNavigate } from '@builder.io/qwik-city';
import { LuUserPlus as UserPlus } from '@qwikest/icons/lucide';
import { EnumUserRole } from '~/types/common';

interface Props {
  addUserData: any;
  handleAddUser: any;
}

export default component$(({ addUserData, handleAddUser }: Props) => {
  return (
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><UserPlus class="w-5 h-5 text-indigo-600" />Tạo Nhân Viên</h3>
      {addUserData.value.success && (
        <div class="bg-green-50 text-green-600 text-sm px-3 py-1 rounded">Lưu thành công</div>
      )}
      {addUserData.value.error != '' && (
        <div class="bg-red-50 text-red-600 text-sm px-3 py-1 rounded">{addUserData.value.error}</div>
      )}
      <Form preventdefault:submit class="space-y-4" onSubmit$={handleAddUser}>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
          <input type="text" required value={addUserData.value.name} onChange$={(e) => (addUserData.value.name = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required value={addUserData.value.email} onChange$={(e) => (addUserData.value.email = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" required value={addUserData.value.username} onChange$={(e) => (addUserData.value.username = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="text" required value={addUserData.value.password} onChange$={(e) => (addUserData.value.password = (e.target as HTMLInputElement).value)} class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select value={addUserData.value.role} onChange$={(e) => (addUserData.value.role = (e.target as HTMLSelectElement).value as EnumUserRole)} class="w-full rounded-lg border-gray-300 border p-2 outline-none">
            {Object.values(EnumUserRole).map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors">Lưu Thông Tin</button>
      </Form>
    </div>
  );
});
