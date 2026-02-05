import { component$, Slot } from '@builder.io/qwik';
import { Sidebar } from '~/components/Sidebar';
import { verifyJWT } from '~/services/hash.service';
import { type RequestHandler } from '@builder.io/qwik-city';
import { User } from '~/models/user.model';
import { connectDB } from '~/libs/db';
import { EnumUserCustomPermission, EnumUserRole } from '~/types/common';
export const onGet: RequestHandler = async ({ cookie, redirect, sharedMap }) => {
    const user = sharedMap.get('user');
    // console.log(user)
    if (user.role != EnumUserRole.DIRECTOR && !user.customPermissions.includes(EnumUserCustomPermission.VIEW_ALL_DATA)) {
        // Nếu không có quyền, chuyển hướng đến trang dashboard
        throw redirect(302, '/dashboard');
    }
  // Nếu có token, tiếp tục tải trang dashboard
};

export default component$(() => {
    return (
        <Slot />
    )


})