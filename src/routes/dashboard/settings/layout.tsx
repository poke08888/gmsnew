import { component$, Slot } from '@builder.io/qwik';
import { Sidebar } from '~/components/Sidebar';
import { verifyJWT } from '~/services/hash.service';
import { routeAction$, type RequestHandler } from '@builder.io/qwik-city';
import { User } from '~/models/user.model';
import { connectDB } from '~/libs/db';
import { Brand } from "~/models/brand.model";

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

export const useAddBrand = routeAction$(async (data, { sharedMap, redirect }) => {
    const session = sharedMap.get('session');
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        return { success: false,
            message: 'Người dùng không tồn tại'
        }
    }
    // console.log(user)
    if (user.role != EnumUserRole.DIRECTOR) {
        return { success: false,
            message: 'Bạn không có quyền thực hiện hành động này'
        }
    }
    const { name } = data;
    await connectDB();
    const brand = new Brand({ name });
    await brand.save();
    
    return { success: true,
        message: 'Thương hiệu đã được thêm thành công'
    }
})

export const useDeleteBrand = routeAction$(async (data, { sharedMap, redirect }) => {
    const session = sharedMap.get('session');
    await connectDB();
    const user = await User.findById(session.user._id);
    if (!user) {
        return { success: false,
            message: 'Người dùng không tồn tại'
        }
    }
    if (user.role != EnumUserRole.DIRECTOR) {
        return { success: false,
            message: 'Bạn không có quyền thực hiện hành động này'
        }
    }
    const { brandId } = data;
    await connectDB();
    await Brand.deleteOne({ _id: brandId as string });
    return { success: true,
        message: 'Thương hiệu đã được xóa thành công'
    }
})

export default component$(() => {
    return (
        <Slot />
    )


})