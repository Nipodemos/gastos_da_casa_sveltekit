import { fail, redirect } from '@sveltejs/kit';
import { createSessionToken } from '../server/auth';
import { SENHA_LOGIN } from '$env/static/private';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const senha = data.get('senha') as string;

		if (!senha) {
			return fail(400, { login: senha, error: 'Senha é obrigatória.' });
		}

		const senhaCorreta = SENHA_LOGIN === senha;
		if (!senhaCorreta) {
			return fail(401, { senha: senha, error: 'Senha inválida.' });
		}
		// Cria o token da sessão
		const token = createSessionToken();

		// Define o cookie
		cookies.set('session_token', token, {
			path: '/',
			httpOnly: true, // O cookie não é acessível via JS no cliente
			secure: process.env.NODE_ENV === 'production', // Use secure em produção
			maxAge: 35 * 24 * 60 * 60 // 35 dias
		});

		// Redireciona para a página de perfil
		throw redirect(303, '/app');
	}
};
