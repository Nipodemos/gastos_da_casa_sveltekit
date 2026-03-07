import { redirect } from '@sveltejs/kit';
import { remult } from 'remult';
import type { LayoutServerLoad } from './$types';

/**
 * Protege as rotas internas da aplicação contra acesso sem autenticação.
 */
const carregarLayoutDoApp: LayoutServerLoad = async () => {
	if (!remult.authenticated()) {
		throw redirect(303, `/`);
	}
	return {};
};

export const load = carregarLayoutDoApp;
