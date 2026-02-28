import { component$, useSignal, $, Slot } from '@builder.io/qwik';
import { Form, routeAction$, zod$, z, Link } from '@builder.io/qwik-city';
import type { DocumentHead } from "@builder.io/qwik-city";
import { AuthUser } from '../../services/user.service';
import { generateJWT } from '~/services/hash.service';
import type { RequestHandler } from '@builder.io/qwik-city';
export const onRequest: RequestHandler = async ({ sharedMap, redirect }) => {
    const session = sharedMap.get('session');
    if (session?.user) {
        throw redirect(302, '/dashboard');
    }
}

export default component$(() => {
    return (
        <Slot />
    )
})