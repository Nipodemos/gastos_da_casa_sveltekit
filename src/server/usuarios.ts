import { SENHA_LOGIN } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { remult } from 'remult';
import { tursoClient } from './database';
import { Usuario } from '$shared/usuario.model';
import { api } from './api';
import {
	gerarHashDoCodigoDeAcesso,
	normalizarCodigoDeAcesso,
	verificarCodigoDeAcesso
} from './auth';

export interface AuthenticatedUser {
	id: string;
	name: string;
}

export interface LoginResult {
	user: AuthenticatedUser;
	createdNow: boolean;
	migratedLegacyData: boolean;
}

/**
 * Monta o nome padrão de exibição para uma nova conta criada automaticamente.
 */
function montarNomeDoUsuario(quantidadeDeUsuarios: number) {
	return `Conta ${quantidadeDeUsuarios + 1}`;
}

/**
 * Atribui os registros antigos sem dono para o usuário recém-identificado.
 */
async function migrarDadosLegadosParaUsuario(usuarioId: string) {
	await tursoClient.execute({
		sql: "UPDATE despesas SET usuarioId = ? WHERE usuarioId IS NULL OR usuarioId = ''",
		args: [usuarioId]
	});
	await tursoClient.execute({
		sql: "UPDATE despesasFixas SET usuarioId = ? WHERE usuarioId IS NULL OR usuarioId = ''",
		args: [usuarioId]
	});
	await tursoClient.execute({
		sql: "UPDATE pessoas SET usuarioId = ? WHERE usuarioId IS NULL OR usuarioId = ''",
		args: [usuarioId]
	});
}

/**
 * Localiza ou cria uma conta a partir do código de acesso informado.
 */
export async function autenticarComCodigoDeAcesso(
	event: RequestEvent,
	codigoDeAcesso: string
): Promise<LoginResult | null> {
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
				user: {
					id: usuarioExistente.id,
					name: usuarioExistente.nome
				},
				createdNow: false,
				migratedLegacyData: false
			};
		}

		const novoUsuario = await repositorioDeUsuarios.insert({
			nome: montarNomeDoUsuario(usuarios.length),
			senhaHash: gerarHashDoCodigoDeAcesso(codigoDeAcessoNormalizado)
		});

		let migrouDadosLegados = false;
		if (normalizarCodigoDeAcesso(SENHA_LOGIN) === codigoDeAcessoNormalizado) {
			await migrarDadosLegadosParaUsuario(novoUsuario.id);
			migrouDadosLegados = true;
		}

		return {
			user: {
				id: novoUsuario.id,
				name: novoUsuario.nome
			},
			createdNow: true,
			migratedLegacyData: migrouDadosLegados
		};
	});
}
