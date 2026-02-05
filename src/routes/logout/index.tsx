import { type RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ cookie, redirect }) => {
  // Xóa cookie (ví dụ: auth_token)
  cookie.delete('auth_token', {
    path: '/',
  });

  // Redirect về trang login hoặc home
  throw redirect(302, '/login');
};