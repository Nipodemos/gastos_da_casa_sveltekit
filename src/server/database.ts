import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createClient } from '@libsql/client';
import { SqlDatabase } from 'remult';
import { TursoDataProvider } from 'remult/remult-turso';

function criarClienteBanco() {
	if (dev) {
		return createClient({
			url: env.LOCAL_DATABASE_URL || 'file:mydb.sqlite'
		});
	}

	if (!env.TURSO_DATABASE_URL) {
		throw new Error('TURSO_DATABASE_URL não configurada para o ambiente de produção.');
	}

	return createClient({
		url: env.TURSO_DATABASE_URL,
		authToken: env.TURSO_AUTH_TOKEN
	});
}

export const tursoClient = criarClienteBanco();

export const dataProvider = new SqlDatabase(new TursoDataProvider(tursoClient));
