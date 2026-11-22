import { Allow, BackendMethod, remult } from 'remult';
import { Despesa } from '../shared/despesa.model';
import { DespesaFixa } from '../shared/despesa-fixa.model';

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

function dataPertenceAoMesAno(data: Date | undefined, mes: number, ano: number) {
	if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
		return false;
	}

	return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1;
}

function criarDataVencimentoUtc(ano: number, mes: number, diaVencimento: number) {
	let dataVencimento = new Date(Date.UTC(ano, mes - 1, diaVencimento));

	// Ajuste para meses mais curtos (ex.: dia 31 em fevereiro)
	if (dataVencimento.getUTCMonth() !== mes - 1) {
		dataVencimento = new Date(Date.UTC(ano, mes, 0));
	}

	return dataVencimento;
}

export class DespesasController {
	@BackendMethod({ allowed: Allow.authenticated })
	/**
	 * Garante a materialização das despesas fixas ativas do mês e retorna
	 * todas as despesas não excluídas do período em uma única chamada.
	 */
	static async carregarDespesasDoMes(mes: number, ano: number): Promise<Despesa[]> {
		const despesaRepo = remult.repo(Despesa);
		const despesaFixaRepo = remult.repo(DespesaFixa);

		const inicioMesUtc = Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0);
		const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

		// Margem de 1 dia nas pontas para evitar divergências de fuso horário em `dateOnly`
		const inicioBusca = new Date(inicioMesUtc - UM_DIA_EM_MS);
		const fimBusca = new Date(fimMes.getTime() + UM_DIA_EM_MS);

		// Busca fixas ativas e despesas do período em paralelo (elimina loop N+1)
		const [fixasAtivas, despesasNoIntervalo] = await Promise.all([
			despesaFixaRepo.find({ where: { ativa: true } }),
			despesaRepo.find({
				where: {
					data: { $gte: inicioBusca, $lte: fimBusca }
				}
			})
		]);

		const despesasDoMes = despesasNoIntervalo.filter((despesa) =>
			dataPertenceAoMesAno(despesa.data, mes, ano)
		);

		// Considera inclusive as marcadas como `excluida` para não recriar fixas excluídas
		const fixasJaGeradasNoMes = new Set(
			despesasDoMes
				.map((despesa) => despesa.despesaFixaId)
				.filter((despesaFixaId): despesaFixaId is string => Boolean(despesaFixaId))
		);

		const novasDespesasFixas = fixasAtivas
			.filter(
				(fixa) =>
					(!fixa.inicio || fixa.inicio <= fimMes) && !fixasJaGeradasNoMes.has(fixa.id)
			)
			.map((fixa) => ({
				descricao: fixa.descricao,
				valor: fixa.valor,
				data: criarDataVencimentoUtc(ano, mes, fixa.diaVencimento),
				despesaFixaId: fixa.id,
				paga: false,
				fixa: true,
				excluida: false
			}));

		if (novasDespesasFixas.length > 0) {
			const inseridas = await despesaRepo.insert(novasDespesasFixas);
			despesasDoMes.push(...inseridas);
		}

		return despesasDoMes
			.filter((despesa) => !despesa.excluida)
			.sort((a, b) =>
				a.descricao.localeCompare(b.descricao, 'pt-BR', {
					sensitivity: 'base'
				})
			);
	}
}
