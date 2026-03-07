import { fail, redirect } from '@sveltejs/kit';
import { criarTokenDaSessao } from '../server/auth';
import type { Actions } from './$types';
import { autenticarComCodigoDeAcesso } from '../server/usuarios';

/**
 * Processa o envio do formulário de login baseado apenas no código de acesso.
 */
async function processarLogin(event: Parameters<Actions['default']>[0]) {
	const { request, cookies } = event;
	const data = await request.formData();
	const senha = data.get('senha') as string;

	if (!senha?.trim()) {
		return fail(400, { login: senha, error: 'Senha é obrigatória.' });
	}

	const loginResult = await autenticarComCodigoDeAcesso(event, senha);
	if (!loginResult) {
		return fail(401, { senha: senha, error: 'Senha inválida.' });
	}

	const token = criarTokenDaSessao(loginResult.user);

	cookies.set('session_token', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 35 * 24 * 60 * 60 // 35 dias
	});

	throw redirect(303, '/app');
}

export const actions: Actions = {
	default: processarLogin
};
