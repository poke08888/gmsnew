import { component$, Slot } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { type RequestHandler } from '@builder.io/qwik-city';


export default component$(() => {
  return (
      <Slot />
  );
});