import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Protege as rotas internas da aplicação contra acesso sem autenticação.
 */
const carregarLayoutDoApp: LayoutServerLoad = async ({ locals }) => {
	if (!locals.logado) {
		throw redirect(303, `/`);
	}
	return {};
};

export const load = carregarLayoutDoApp;
