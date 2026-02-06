import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { type RequestHandler } from '@builder.io/qwik-city';

export const onRequest: RequestHandler = async ({ cookie, redirect }) => {
  redirect(302, '/dashboard');
}

// export default component$(() => {
//   return (
//     <>
//       <h1>Hi 👋</h1>
//       <div>
//         Can't wait to see what you build with qwik!
//         <br />
//         Happy coding.
//       </div>
//     </>
//   );
// });

// export const head: DocumentHead = {
//   title: "Welcome to Qwik",
//   meta: [
//     {
//       name: "description",
//       content: "Qwik site description",
//     },
//   ],
// };
