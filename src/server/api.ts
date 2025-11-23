import { remultApi } from "remult/remult-sveltekit";
import { SqlDatabase, type UserInfo } from "remult";
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '$env/static/private';
import { entities } from "$shared/entities";

import { DespesasController } from "./despesas.controller";
import { TursoDataProvider } from 'remult/remult-turso'
import { createClient } from '@libsql/client'

export const api = remultApi({
  admin: true,
  controllers: [DespesasController],
  entities: entities,
  dataProvider: new SqlDatabase(
      new TursoDataProvider(
        createClient({
          url: TURSO_DATABASE_URL,
          authToken: TURSO_AUTH_TOKEN,
        }),
      ),
    ),

  getUser: async (event): Promise<UserInfo | undefined> => {
    if (!event.locals.logado) {
      // console.log("🔍 Nenhum usuário em locals");
      return undefined;
    }

    return {
      id: '1',
      name: "Administrador",
      roles: ["admin"],
    };
  },
});
