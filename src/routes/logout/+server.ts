import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Encerra a sessão atual removendo o cookie autenticado.
 */
const encerrarSessao: RequestHandler = async ({ cookies }) => {
	cookies.delete('session_token', { path: '/' });
	throw redirect(303, '/');
};

export const POST = encerrarSessao;
