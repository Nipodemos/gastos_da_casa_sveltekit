import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load = (({ locals, url }) => {
  if (!locals.logado && url.pathname !== "/") {
    throw redirect(303, `/`);
  } else if (locals.logado && url.pathname === "/") {
    throw redirect(303, `/app`);
  }
  return { logado: locals.logado };
}) satisfies LayoutServerLoad;
