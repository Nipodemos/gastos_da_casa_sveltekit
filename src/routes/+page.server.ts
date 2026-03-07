import { fail, redirect } from '@sveltejs/kit';
import { createSessionToken } from '../server/auth';
import type { Actions } from './$types';
import { authenticateWithAccessCode } from '../server/usuarios';

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies } = event;
		const data = await request.formData();
		const senha = data.get('senha') as string;

		if (!senha?.trim()) {
			return fail(400, { login: senha, error: 'Senha é obrigatória.' });
		}

		const loginResult = await authenticateWithAccessCode(event, senha);
		if (!loginResult) {
			return fail(401, { senha: senha, error: 'Senha inválida.' });
		}

		const token = createSessionToken(loginResult.user);

		cookies.set('session_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 35 * 24 * 60 * 60 // 35 dias
		});

		throw redirect(303, '/app');
	}
};
