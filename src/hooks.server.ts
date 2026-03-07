import { sequence } from '@sveltejs/kit/hooks';
import { api as handleRemult } from './server/api';
import { verifySessionToken } from './server/auth';
import type { Handle } from '@sveltejs/kit';

export const handleAuth: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session_token');

	event.locals.logado = false;
	event.locals.usuario = undefined;

	if (token) {
		const dadosJWT = verifySessionToken(token);

		if (dadosJWT?.user?.id) {
			event.locals.logado = true;
			event.locals.usuario = dadosJWT.user;
		}
	}

	return resolve(event);
};

export const handle = sequence(handleAuth, handleRemult);
