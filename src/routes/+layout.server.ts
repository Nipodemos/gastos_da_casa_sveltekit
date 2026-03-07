import { redirect } from '@sveltejs/kit';
import { remult } from 'remult';
import type { LayoutServerLoad } from './$types';

/**
 * Controla os redirecionamentos entre login e área autenticada.
 */
const carregarLayoutRaiz: LayoutServerLoad = ({ url }) => {
	const logado = remult.authenticated();

	if (!logado && url.pathname !== '/') {
		throw redirect(303, `/`);
	} else if (logado && url.pathname === '/') {
		throw redirect(303, `/app`);
	}
	return {};
};

export const load = carregarLayoutRaiz;
