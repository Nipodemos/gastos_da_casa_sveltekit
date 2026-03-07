import { remult } from 'remult';
import type { LayoutLoad } from './$types';

/**
 * Encaminha as requisições do Remult incluindo sempre os cookies da sessão.
 */
function buscarComCredenciais(
	event: Parameters<LayoutLoad>[0],
	input: RequestInfo | URL,
	init?: RequestInit
) {
	return event.fetch(input, {
		...init,
		credentials: 'include'
	});
}

/**
 * Configura o `fetch` usado pelo Remult no cliente.
 */
const carregarLayoutCliente: LayoutLoad = (event) => {
	remult.useFetch((input, init) => buscarComCredenciais(event, input, init));
	return { logado: event.data.logado };
};

export const load = carregarLayoutCliente;
