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
    const session = sharedMap.get('session');
    if (!session) {
        throw redirect(302, '/login');
    }
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        throw redirect(302, '/login');
    }
    sharedMap.set('user', user.toObject());
  // Nếu có token, tiếp tục tải trang dashboard
};

export const useCurrentUser = routeLoader$(async ({sharedMap, redirect}) => {
    const session = sharedMap.get('session');
    if (!session) {
        throw redirect(302, '/login');
    }
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        throw redirect(302, '/login');
    }
    return user.toObject();

})

export default component$(() => {
    const currentUser = useCurrentUser()
    return (
        <div class="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar/>
            <div class="flex-1 ml-64">
                <main class="p-8 max-w-7xl mx-auto">
                    <Slot />
                </main>
            </div>
        </div>        
    )


})