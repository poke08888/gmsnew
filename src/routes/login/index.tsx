import { LuPieChart as PieChart, LuLogIn as LogIn, LuLock as Lock, LuUser as UserIcon, LuAlertCircle as AlertCircle } from '@qwikest/icons/lucide';
import { $, component$, useStore } from '@builder.io/qwik';
import { Form, routeAction$, zod$, z, Link } from '@builder.io/qwik-city';
import type { DocumentHead } from "@builder.io/qwik-city";
import { AuthUser } from '../../services/user.service';
import { generateJWT } from '~/services/hash.service';

import { useSignIn } from '../plugin@auth';
const useLogin = routeAction$(async (data, {fail, cookie, redirect}) => {
  // console.log('Server nhận dữ liệu:', data);

  const { username, password } = data;

  const success = await AuthUser(username, password);
  if (!success) {
    return fail(400, {failed: true, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }
  
  const token = await generateJWT({ username }, '24h');
  // console.log('Generated JWT:', token);
  cookie.set('auth_token', token, { path: '/', httpOnly: false, secure: false, maxAge: 60 * 60 * 24 });
  // console.log('--- [SERVER] Đã set Cookie, chuẩn bị Redirect sang /dashboard ---');
  throw redirect(302, '/dashboard');
}, zod$({
    username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}));

export const head: DocumentHead = {
  title: "Đăng nhập - GMS",
  meta: [
    {
      name: "description",
      content: "Trang đăng nhập hệ thống quản lý GlowMe",
    },
  ],
};

export default component$(() => {
    const loginAction = useSignIn();
    const signInData = useStore({
        username: '',
        password: '',
    })
    const handleSignin = $( async () => {
      // const formdata = new FormData();
      // formdata.append('username', signInData.username);
      // formdata.append('password', signInData.password);
      // formdata.append('providerId', 'Credentials');
      // formdata.append('options', JSON.stringify({ callbackUrl: '/dashboard' }));
      // const result = await loginAction.submit(formdata);
        const result = await loginAction.submit({
          providerId: 'credentials',
          options: {
            username: signInData.username,
            password: signInData.password,
            callbackUrl: '/dashboard',
          }
        });
    })
    return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div class="bg-indigo-600 p-8 text-center">
          <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white bg-opacity-20 mb-4">
            <PieChart class="h-10 w-10 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white uppercase tracking-wider">GMS - GlowMe Management System</h1>
          <p class="text-indigo-100 text-sm mt-2">Hệ thống báo cáo doanh thu GlowMe</p>
        </div>

        <Form onSubmit$={handleSignin} class="p-8 space-y-6">
          {/* {loginAction.value?.failed && (
            <div class="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle class="w-5 h-5" />
              <span>{loginAction.value?.error}</span>
            </div>
          )} */}
          <input type="hidden" name="providerId" value="credentials" />
          <input type="hidden" name="callbackUrl" value="/dashboard" />
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <div class="relative">
                {/* {loginAction.value?.fieldErrors?.username && (
                    <p class="text-red-500">{loginAction.value.fieldErrors.username}</p>
                )} */}
                <input
                  type="text"
                  required
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="admin"
                  name='username'
                  onChange$={(e: Event) => signInData.username = (e.target as HTMLInputElement).value}
                />
                <UserIcon class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div class="relative">
                {/* {loginAction.value?.fieldErrors?.password && (
                    <p class="text-red-500">{loginAction.value.fieldErrors.password}</p>
                )} */}
                <input
                  type="password"
                  required
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="••••••••"
                  name='password'
                  onChange$={(e: Event) => signInData.password = (e.target as HTMLInputElement).value}
                />
                <Lock class="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginAction.isRunning}
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loginAction.isRunning ? 'Đang xác thực...' : (
              <>
                <LogIn class="w-5 h-5" />
                Đăng Nhập
              </>
            )}
          </button>

          <div class="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" class="text-indigo-600 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );



})