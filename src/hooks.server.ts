import { sequence } from '@sveltejs/kit/hooks';
import { remult } from 'remult';
import { api as handleRemult } from './server/api';
import type { Handle } from '@sveltejs/kit';

/**
 * Usa o contexto do Remult para refletir no `locals` se a request atual está autenticada.
 */
const autenticarSessao: Handle = async ({ event, resolve }) => {
	event.locals.logado = remult.authenticated();
	return resolve(event);
};

export const handle = sequence(handleRemult, autenticarSessao);
