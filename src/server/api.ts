import type { RequestEvent } from '@sveltejs/kit';
import { remultApi } from 'remult/remult-sveltekit';
import { type UserInfo } from 'remult';
import jwt from 'jsonwebtoken';
import { AUTH_SECRET, SENHA_LOGIN } from '$env/static/private';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { entities } from '$shared/entities';

import { DespesasController } from './despesas.controller';
import { dataProvider, tursoClient } from './database';

interface DadosJWT {
	user: {
		id: string;
		name: string;
	};
}

function normalizarCodigoDeAcesso(codigoDeAcesso: string) {
	return codigoDeAcesso.trim();
}

function verificarCodigoDeAcesso(codigoDeAcesso: string, hashArmazenado: string) {
	const [salt, hash] = hashArmazenado.split(':');
	if (!salt || !hash) {
		return false;
	}

	const calculatedHash = scryptSync(normalizarCodigoDeAcesso(codigoDeAcesso), salt, 64);
	const storedHashBuffer = Buffer.from(hash, 'hex');
	if (storedHashBuffer.length !== calculatedHash.length) {
		return false;
	}

	return timingSafeEqual(storedHashBuffer, calculatedHash);
}

async function usuarioPodeAcessarAdmin(usuarioId: string) {
	const senhaDoAdmin = normalizarCodigoDeAcesso(SENHA_LOGIN);
	if (!senhaDoAdmin) {
		return false;
	}

	const resultado = await tursoClient.execute({
		sql: 'SELECT senhaHash FROM usuarios WHERE id = ? LIMIT 1',
		args: [usuarioId]
	});

	const senhaHash = resultado.rows[0]?.senhaHash;
	if (typeof senhaHash !== 'string') {
		return false;
	}

	return verificarCodigoDeAcesso(senhaDoAdmin, senhaHash);
}

/**
 * Resolve o usuário autenticado a partir do cookie da requisição atual.
 */

export const api = remultApi({
	controllers: [DespesasController],
	entities,
	dataProvider,
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
			const roles = (await usuarioPodeAcessarAdmin(usuario.id)) ? ['admin'] : [];

			return {
				id: usuario.id,
				name: usuario.name,
				roles
			};
		} catch {
			return undefined;
		}
	}
});
