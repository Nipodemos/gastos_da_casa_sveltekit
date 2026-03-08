import type { RequestEvent } from '@sveltejs/kit';
import { remult } from 'remult';
import { Usuario } from '$shared/usuario.model';
import { api } from './api';
import {
	codigoDeAcessoEhSenhaBootstrapDoAdmin,
	verificarCodigoDeAcesso
} from './auth';

export interface AuthenticatedUser {
	id: string;
	name: string;
	isAdmin?: boolean;
}

/**
 * Localiza uma conta existente a partir do código de acesso informado.
 */
export async function autenticarComCodigoDeAcesso(
	event: RequestEvent,
	codigoDeAcesso: string
): Promise<AuthenticatedUser | null> {
	if (!codigoDeAcesso) {
		return null;
	}

	return api.withRemult(event, async () => {
		const repositorioDeUsuarios = remult.repo(Usuario);
		const usuarios = await repositorioDeUsuarios.find({
			orderBy: {
				createdAt: 'asc'
			}
		});
		const senhaEhAdminBootstrap = codigoDeAcessoEhSenhaBootstrapDoAdmin(codigoDeAcesso);

		const usuarioExistente = usuarios.find((usuario) =>
			verificarCodigoDeAcesso(codigoDeAcesso, usuario.senhaHash)
		);
		if (usuarioExistente) {
			return {
				id: usuarioExistente.id,
				name: usuarioExistente.nome,
				isAdmin: senhaEhAdminBootstrap
			};
		}

		return null;
	});
}
