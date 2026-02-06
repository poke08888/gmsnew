import { component$, Slot } from '@builder.io/qwik';
import { routeAction$, routeLoader$ } from '@builder.io/qwik-city';
import { Sidebar } from '~/components/Sidebar';
import { verifyJWT } from '~/services/hash.service';
import { type RequestHandler } from '@builder.io/qwik-city';
import { User } from '~/models/user.model';
import { connectDB } from '~/libs/db';

export const handleLogout = routeAction$(async (_, {cookie, redirect}) => {
    // Xóa cookie (ví dụ: auth_token)
    cookie.delete('auth_token', { path: '/' });
    throw redirect(302, '/login');
})


export const onGet: RequestHandler = async ({ cookie, redirect, sharedMap }) => {
  const authToken = cookie.get('auth_token')?.value;

  if (!authToken) {
    // Nếu không có token, chuyển hướng đến trang đăng nhập
    throw redirect(302, '/login');
  }

    const isValid = await verifyJWT(authToken);
    // console.log('isValid', isValid);
    if (!isValid) {
      // Nếu token không hợp lệ, chuyển hướng đến trang đăng nhập
      throw redirect(302, '/login');
    }

    await connectDB();
    sharedMap.set('user', isValid);

  // Nếu có token, tiếp tục tải trang dashboard
};

const useCurrentUser = routeLoader$(async ({sharedMap}) => {
    const user = sharedMap.get('user');
    return user;
})

export default component$(() => {
    const currentUser = useCurrentUser()
    return (
        <div class="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar currentUser={currentUser}/>
            <div class="flex-1 ml-64">
                <main class="p-8 max-w-7xl mx-auto">
                    <Slot />
                </main>
            </div>
        </div>        
    )


})