import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	if (!locals.logado) {
		throw redirect(303, `/`);
	}
	return { usuario: locals.usuario };
}) satisfies LayoutServerLoad;
