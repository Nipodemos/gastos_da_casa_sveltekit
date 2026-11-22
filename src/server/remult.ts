import { building, dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';
import { remultApi } from 'remult/remult-sveltekit';
import type { UserInfo } from 'remult';
import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '$env/static/private';
import { entities } from '$shared/entities';

import { DespesasController } from './despesas.controller';
import { dataProvider } from './database';

interface DadosJWT {
	user: {
		id: string;
		name: string;
		isAdmin?: boolean;
	};
}

/**
 * Resolve o usuário autenticado a partir do cookie JWT da requisição atual,
 * sem consultas extras ao banco ou recomputação de hash a cada request.
 */
export const remultServer = remultApi({
	controllers: [DespesasController],
	entities,
	dataProvider,
	ensureSchema: dev || building,
	admin: 'admin',

	getUser: async function (event: RequestEvent): Promise<UserInfo | undefined> {
		const token = event.cookies.get('session_token');
		if (!token) {
			return undefined;
		}

		try {
			const payload = jwt.verify(token, AUTH_SECRET);
			if (typeof payload !== 'object' || !payload || !('user' in payload) || !payload.user) {
				return undefined;
			}

			const usuario = (payload as DadosJWT).user;

			return {
				id: usuario.id,
				name: usuario.name,
				roles: usuario.isAdmin ? ['admin'] : []
			};
		} catch {
			return undefined;
		}
	}
});
