import type { RequestEvent } from '@sveltejs/kit';
import { remultApi } from 'remult/remult-sveltekit';
import { type UserInfo } from 'remult';
import { entities } from '$shared/entities';

import { DespesasController } from './despesas.controller';
import { obterUsuarioDaSessao } from './auth';
import { dataProvider } from './database';

/**
 * Resolve o usuário autenticado a partir do cookie da requisição atual.
 */
async function obterUsuarioDoEvento(event: RequestEvent): Promise<UserInfo | undefined> {
	const token = event.cookies.get('session_token');
	const usuario = obterUsuarioDaSessao(token);
	if (!usuario) {
		return undefined;
	}

	return {
		id: usuario.id,
		name: usuario.name,
		roles: []
	};
}

export const api = remultApi({
	controllers: [DespesasController],
	entities,
	dataProvider,

	getUser: obterUsuarioDoEvento
});
