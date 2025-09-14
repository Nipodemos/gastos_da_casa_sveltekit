import { entities } from '$shared/entities';
import { SqlDatabase } from 'remult';
import { remultApi } from 'remult/remult-sveltekit';
import Database from 'better-sqlite3';
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3';

export const api = remultApi({
	admin: true,
	entities: entities,
	controllers: [],
	dataProvider: new SqlDatabase(new BetterSqlite3DataProvider(new Database('./mydb.sqlite')))
});
