import { LuLayoutDashboard as LayoutDashboard, LuUpload as Upload, LuSettings as Settings, LuPieChart as PieChart, LuUsers as Users, LuFileText as FileText, LuPackage as Package, LuLogOut as LogOut, LuShield as Shield } from '@qwikest/icons/lucide';

import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { EnumUserCustomPermission, EnumUserRole } from '~/types/common';

import { handleLogout } from '~/routes/dashboard/layout';
// const isActive = (path: string) => {
//     if (path === '/' && location.pathname !== '/') return 'text-indigo-100 hover:bg-indigo-800 hover:text-white';
//     return location.pathname.startsWith(path) ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-800 hover:text-white';
// };

// const 
interface Props {
  currentUser: any;
}

export const Sidebar = component$(({ currentUser }: Props) => {
    // console.log(currentUser);
    const handleLogoutAction = handleLogout()
    const location = useLocation();
    const isActive = (path: string) => {
        if (path === '/' && location.url.pathname !== '/') return 'text-indigo-100 hover:bg-indigo-800 hover:text-white';
        return location.url.pathname.startsWith(path) ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-800 hover:text-white';
    }
    return (
    <div class="w-64 bg-indigo-900 min-h-screen flex flex-col text-white shadow-xl fixed left-0 top-0 z-50">
      <div class="h-16 flex items-center justify-center border-b border-indigo-800">
        <div class="flex items-center gap-2 font-bold text-xl">
          <PieChart class="h-6 w-6 text-indigo-400" />
          <span>GMS</span>
        </div>
      </div>
      
      <nav class="flex-1 py-6">
        <ul class="space-y-2 px-4">
          <li>
            <Link href="/dashboard" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard')}`}>
              <LayoutDashboard class="h-5 w-5" />
              <span class="font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/products" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/products')}`}>
              <Package class="h-5 w-5" />
              <span class="font-medium">Sản phẩm</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/partners" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/partners')}`}>
              <Users class="h-5 w-5" />
              <span class="font-medium">Chi tiết Khách hàng</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/orders" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/orders')}`}>
              <FileText class="h-5 w-5" />
              <span class="font-medium">Danh sách Đơn hàng</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/upload" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/upload')}`}>
              <Upload class="h-5 w-5" />
              <span class="font-medium">Upload Đơn Hàng</span>
            </Link>
          </li>
          
          {/* {isAdmin && ( */}
          {(currentUser.value.role == EnumUserRole.DIRECTOR || currentUser.value.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) && (
            <li>
              <Link href="/dashboard/settings" class={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/settings')}`}>
                <Settings class="h-5 w-5" />
                <span class="font-medium">Cài đặt Hệ thống</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div class="p-4 border-t border-indigo-800 space-y-4">
        <div class="flex items-center gap-3 bg-indigo-800 bg-opacity-50 p-3 rounded-xl border border-indigo-700">
          <div class="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-500 shadow-inner">
            {/* {currentUser?.name.substring(0, 2).toUpperCase() || 'AD'} */}
            {currentUser.value.name.substring(0, 2).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate flex items-center gap-1">
              {/* {currentUser?.name || 'User'} */}
              {currentUser.value.name}
              {/* {isAdmin && <Shield class="w-3 h-3 text-indigo-400" />} */}
              {currentUser.value.role == EnumUserRole.DIRECTOR && <Shield class="w-3 h-3 text-indigo-400" />}
            </p>
            {/* <p class="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">{currentUser?.role || 'Staff'}</p> */}
            <p class="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">{currentUser.value.role || "STAFF"}</p>
          </div>
        </div>
        {/* <button 
          onClick={handleLogout}
          class="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-800 hover:bg-red-600 rounded-xl transition-all text-sm font-bold border border-indigo-700 hover:border-red-500 shadow-sm cursor-pointer"
        >
          <LogOut class="h-4 w-4" />
          Đăng xuất
        </button> */}
        <button 
            onClick$={async () => {
              await handleLogoutAction.submit()
            }}
            class="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-800 hover:bg-red-600 rounded-xl transition-all text-sm font-bold border border-indigo-700 hover:border-red-500 shadow-sm cursor-pointer"
        >
            <LogOut class="h-4 w-4" />
            Đăng xuất
        </button>
      </div>
    </div>
  );
})