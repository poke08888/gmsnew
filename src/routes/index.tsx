import { type RequestHandler } from '@builder.io/qwik-city';

export const onRequest: RequestHandler = ({ redirect }) => {
  // Điều hướng 302 (tạm thời) sang dashboard
  throw redirect(302, '/dashboard/');
};