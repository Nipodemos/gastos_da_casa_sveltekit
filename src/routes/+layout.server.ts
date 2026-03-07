import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Controla os redirecionamentos entre login e área autenticada.
 */
const carregarLayoutRaiz: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.logado && url.pathname !== '/') {
		throw redirect(303, `/`);
	} else if (locals.logado && url.pathname === '/') {
		throw redirect(303, `/app`);
	}
	return { logado: locals.logado };
};

export const load = carregarLayoutRaiz;
