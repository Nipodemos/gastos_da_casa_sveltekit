import { remultApi } from 'remult/remult-sveltekit';
import { type UserInfo } from 'remult';
import { entities } from '$shared/entities';

import { DespesasController } from './despesas.controller';
import { dataProvider } from './database';

export const api = remultApi({
	controllers: [DespesasController],
	entities,
	dataProvider,

	getUser: async (event): Promise<UserInfo | undefined> => {
		if (!event.locals.usuario) {
			return undefined;
		}

		return {
			id: event.locals.usuario.id,
			name: event.locals.usuario.name,
			roles: []
		};
	}
});
