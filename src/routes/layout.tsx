import { component$, Slot } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { type RequestHandler } from '@builder.io/qwik-city';
export const onRequest: RequestHandler = ({ request, headers, send }) => {
  // Thiết lập các domain được phép
  const allowedOrigins = ['https://your-frontend-domain.com'];
  const origin = request.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Xử lý Preflight request (OPTIONS)
  if (request.method === 'OPTIONS') {
    send(204, ''); 
  }
};

export default component$(() => {
  return (
      <Slot />
  );
});