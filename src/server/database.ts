import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$env/static/private';
import { createClient } from '@libsql/client';
import { SqlDatabase } from 'remult';
import { TursoDataProvider } from 'remult/remult-turso';

export const tursoClient = createClient({
	url: TURSO_DATABASE_URL,
	authToken: TURSO_AUTH_TOKEN
});

export const dataProvider = new SqlDatabase(new TursoDataProvider(tursoClient));
