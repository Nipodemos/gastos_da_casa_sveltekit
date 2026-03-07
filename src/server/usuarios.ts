import { SENHA_LOGIN } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { remult } from 'remult';
import { tursoClient } from './database';
import { Usuario } from '$shared/usuario.model';
import { api } from './api';
import { hashAccessCode, normalizeAccessCode, verifyAccessCode } from './auth';

export interface AuthenticatedUser {
	id: string;
	name: string;
}

export interface LoginResult {
	user: AuthenticatedUser;
	createdNow: boolean;
	migratedLegacyData: boolean;
}

function buildUserName(userCount: number) {
	return `Conta ${userCount + 1}`;
}

async function migrateLegacyDataToUser(usuarioId: string) {
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

export async function authenticateWithAccessCode(
	event: RequestEvent,
	accessCode: string
): Promise<LoginResult | null> {
	const normalizedAccessCode = normalizeAccessCode(accessCode);
	if (!normalizedAccessCode) {
		return null;
	}

	return api.withRemult(event, async () => {
		const userRepo = remult.repo(Usuario);
		const users = await userRepo.find({
			orderBy: {
				createdAt: 'asc'
			}
		});

		const existingUser = users.find((user) =>
			verifyAccessCode(normalizedAccessCode, user.senhaHash)
		);
		if (existingUser) {
			return {
				user: {
					id: existingUser.id,
					name: existingUser.nome
				},
				createdNow: false,
				migratedLegacyData: false
			};
		}

		const newUser = await userRepo.insert({
			nome: buildUserName(users.length),
			senhaHash: hashAccessCode(normalizedAccessCode)
		});

		let migratedLegacyData = false;
		if (normalizeAccessCode(SENHA_LOGIN) === normalizedAccessCode) {
			await migrateLegacyDataToUser(newUser.id);
			migratedLegacyData = true;
		}

		return {
			user: {
				id: newUser.id,
				name: newUser.nome
			},
			createdNow: true,
			migratedLegacyData
		};
	});
}
