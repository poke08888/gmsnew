import { LuUserPlus as UserPlus, LuLock as Lock, LuUser as UserIcon, LuMail as Mail, LuAlertCircle as AlertCircle } from '@qwikest/icons/lucide';
import { component$ } from '@builder.io/qwik';
import { Form, routeAction$, zod$, z, Link, DocumentHead } from '@builder.io/qwik-city';
import { CreateUser } from '../../services/user.service';
import { EnumUserRole } from '~/types/common';

export const useRegister = routeAction$(async (data, {fail, redirect}) => {

    const { username, password, name, email } = data;
    if (email == "k@nerman.asia") {
      const success = await CreateUser(username, password, name, email, EnumUserRole.DIRECTOR);
      if (!success) {
          return fail(400, {failed: true, error: 'Tên đăng nhập hoặc email đã tồn tại' });
      }
      throw redirect(302, '/login');
    }
    const success = await CreateUser(username, password, name, email);
    if (!success) {
        return fail(400, {failed: true, error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }
    throw redirect(302, '/login');
}, zod$({
    username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    name: z.string().min(3, 'Họ và tên phải có ít nhất 3 ký tự'),
    email: z.string().email('Email không hợp lệ'),
}));

export const head: DocumentHead = {
  title: "Đăng ký - GMS",
  meta: [
    {
      name: "description",
      content: "Trang đăng ký hệ thống quản lý GlowMe",
    },
  ],
};

export default component$(() => {

    const registerAction = useRegister();
    return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900 p-4 py-12">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div class="bg-indigo-600 p-6 text-center">
          <h1 class="text-2xl font-bold text-white uppercase tracking-wider">Đăng Ký Tài Khoản</h1>
          <p class="text-indigo-100 text-sm mt-1">Tạo hồ sơ nhân viên mới trong hệ thống GMS</p>
        </div>

        <Form action={registerAction} class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {registerAction.value?.failed && (
            <div class="col-span-full bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle class="w-5 h-5" />
              <span>{registerAction.value?.error || "Có lỗi xảy ra"}</span>
            </div>
          )}

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <div class="relative">
                {registerAction.value?.fieldErrors?.username && (
                    <p class="text-red-500">{registerAction.value.fieldErrors.username}</p>
                )}
                <input
                  type="text"
                  required
                  name="username"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="username"
                />
                <UserIcon class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div class="relative">
                {registerAction.value?.fieldErrors?.password && (
                    <p class="text-red-500">{registerAction.value.fieldErrors.password}</p>
                )}
                <input
                  type="password"
                  required
                  name="password"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="••••••••"
                />
                <Lock class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
              <div class="relative">
                {registerAction.value?.fieldErrors?.name && (
                    <p class="text-red-500">{registerAction.value.fieldErrors.name}</p>
                )}
                <input
                  type="text"
                  required
                  name="name"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="Nguyễn Văn A"
                />
                <UserIcon class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div class="relative">
                {registerAction.value?.fieldErrors?.email && (
                    <p class="text-red-500">{registerAction.value.fieldErrors.email}</p>
                )}
                <input
                  type="email"
                  required
                  name="email"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="example@company.com"
                />
                <Mail class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={registerAction.isRunning}
            class="col-span-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400 mt-2"
          >
            {registerAction.isRunning ? 'Đang tạo tài khoản...' : (
              <>
                <UserPlus class="w-5 h-5" />
                Hoàn Tất Đăng Ký
              </>
            )}
          </button>

          <div class="col-span-full text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link href="/login" class="text-indigo-600 font-bold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
          
          <div class="col-span-full text-center text-xs text-gray-400 italic">
            * Tài khoản đăng ký với email <strong>k@nerman.asia</strong> sẽ tự động có quyền Giám đốc. Các tài khoản khác mặc định là "Nhân viên".
          </div>
        </Form>
      </div>
    </div>
  );
})