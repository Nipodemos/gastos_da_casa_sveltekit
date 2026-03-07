import type { RequestEvent } from '@sveltejs/kit';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { remult } from 'remult';
import { Usuario } from '$shared/usuario.model';
import { api } from './api';

export interface AuthenticatedUser {
	id: string;
	name: string;
}

/**
 * Remove espaços extras do código de acesso antes de qualquer comparação.
 */
function normalizarCodigoDeAcesso(codigoDeAcesso: string) {
	return codigoDeAcesso.trim();
}

/**
 * Compara um código de acesso em texto puro com o hash armazenado do usuário.
 */
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

/**
 * Localiza uma conta existente a partir do código de acesso informado.
 */
export async function autenticarComCodigoDeAcesso(
	event: RequestEvent,
	codigoDeAcesso: string
): Promise<AuthenticatedUser | null> {
	const codigoDeAcessoNormalizado = normalizarCodigoDeAcesso(codigoDeAcesso);
	if (!codigoDeAcessoNormalizado) {
		return null;
	}

	return api.withRemult(event, async () => {
		const repositorioDeUsuarios = remult.repo(Usuario);
		const usuarios = await repositorioDeUsuarios.find({
			orderBy: {
				createdAt: 'asc'
			}
		});

		const usuarioExistente = usuarios.find((usuario) =>
			verificarCodigoDeAcesso(codigoDeAcessoNormalizado, usuario.senhaHash)
		);
		if (usuarioExistente) {
			return {
				id: usuarioExistente.id,
				name: usuarioExistente.nome
			};
		}

		return null;
	});
}
