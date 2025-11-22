import { remultApi } from "remult/remult-sveltekit";
import { SqlDatabase, type UserInfo } from "remult";
import Database from "better-sqlite3";
import { BetterSqlite3DataProvider } from "remult/remult-better-sqlite3";
import { entities } from "$shared/entities";

import { DespesasController } from "./despesas.controller";

export const api = remultApi({
  admin: true,
  controllers: [DespesasController],
  entities: entities,
  dataProvider: new SqlDatabase(
    new BetterSqlite3DataProvider(new Database("./mydb.sqlite"))
  ),

  getUser: async (event): Promise<UserInfo | undefined> => {
    if (!event.locals.logado) {
      // console.log("🔍 Nenhum usuário em locals");
      return undefined;
    }

    return {
      id: '1',
      name: "Administrador",
      roles: ["administrador"],
    };
  },
});
