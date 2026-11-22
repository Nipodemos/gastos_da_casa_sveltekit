import { remult } from 'remult';
import { Despesa } from '$shared/despesa.model';
import { Pessoa } from '$shared/pessoa.model';
import { DespesasController } from '../../server/despesas.controller';
import type { PageServerLoad } from './$types';

function resolverMesAno(dateParam: string | null) {
	if (dateParam && /^\d{4}-\d{2}$/.test(dateParam)) {
		const [ano, mes] = dateParam.split('-').map(Number);
		if (ano >= 2000 && ano <= 2100 && mes >= 1 && mes <= 12) {
			return { mesAnoSelecionado: dateParam, ano, mes };
		}
	}

	const hoje = new Date();
	const ano = hoje.getUTCFullYear();
	const mes = hoje.getUTCMonth() + 1;
	const mesAnoSelecionado = `${ano}-${String(mes).padStart(2, '0')}`;
	return { mesAnoSelecionado, ano, mes };
}

/**
 * Carrega despesas do mês e pessoas em paralelo no servidor (SSR),
 * evitando waterfall de requisições no cliente.
 */
export const load: PageServerLoad = async ({ url }) => {
	const { mesAnoSelecionado, ano, mes } = resolverMesAno(url.searchParams.get('date'));

	const [despesas, pessoas] = await Promise.all([
		DespesasController.carregarDespesasDoMes(mes, ano),
		remult.repo(Pessoa).find({
			orderBy: { nome: 'asc' }
		})
	]);

	return {
		mesAnoSelecionado,
		despesasJson: remult.repo(Despesa).toJson(despesas),
		pessoasJson: remult.repo(Pessoa).toJson(pessoas)
	};
};
