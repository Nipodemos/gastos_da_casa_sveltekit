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
	const request: RequestInit = {
		...init,
		credentials: 'include'
	};
	const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

	if (url.includes('/api/')) {
		console.log('[remult][client][request]', {
			url,
			method: request.method ?? 'GET',
			body: request.body,
			user: remult.user
		});
	}

	return event.fetch(input, request).then((response) => {
		if (url.includes('/api/')) {
			console.log('[remult][client][response]', {
				url,
				status: response.status,
				ok: response.ok
			});
		}

		return response;
	});
}

/**
 * Configura o `fetch` usado pelo Remult no cliente.
 */
const carregarLayoutCliente: LayoutLoad = (event) => {
	remult.useFetch((input, init) => buscarComCredenciais(event, input, init));
	return {};
};

export const load = carregarLayoutCliente;
