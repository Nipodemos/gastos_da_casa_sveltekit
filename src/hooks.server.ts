import { sequence } from '@sveltejs/kit/hooks';
import { api as handleRemult } from './server/api';
import { obterUsuarioDaSessao } from './server/auth';
import type { Handle } from '@sveltejs/kit';

/**
 * Valida a sessão atual e marca apenas o estado de autenticação no `locals`.
 */
const autenticarSessao: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session_token');
	event.locals.logado = Boolean(obterUsuarioDaSessao(token)?.id);
	return resolve(event);
};

export const handle = sequence(autenticarSessao, handleRemult);
