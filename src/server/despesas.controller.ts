import { Allow, BackendMethod, remult } from 'remult';
import { Despesa } from '../shared/despesa.model';
import { DespesaFixa } from '../shared/despesa-fixa.model';

function dataPertenceAoMesAno(data: Date | undefined, mes: number, ano: number) {
	if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
		return false;
	}

	return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1;
}

export class DespesasController {
	@BackendMethod({ allowed: Allow.authenticated })
	/**
	 * Garante que as despesas fixas ativas existam no mês informado para o usuário atual.
	 */
	static async garantirDespesasFixas(mes: number, ano: number) {
		const despesaRepo = remult.repo(Despesa);
		const despesaFixaRepo = remult.repo(DespesaFixa);

		// 1. Buscar todas as despesas fixas ativas
		const fixas = await despesaFixaRepo.find({ where: { ativa: true } });

		// 2. Definir o último instante do mês em UTC para validar a data de início da fixa
		const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
		for (const fixa of fixas) {
			// Verificar se a despesa fixa começou antes ou durante este mês
			if (fixa.inicio && fixa.inicio > fimMes) {
				continue;
			}

			// 3. Verificar se já existe uma despesa gerada para esta fixa neste mês.
			// Buscamos inclusive as excluídas (soft delete) para não recriar.
			const despesasDaFixa = await despesaRepo.find({
				where: {
					despesaFixaId: fixa.id
				}
			});
			const existente = despesasDaFixa.find((despesa) =>
				dataPertenceAoMesAno(despesa.data, mes, ano)
			);

			if (!existente) {
				// 4. Se não existe, criar
				// Usar UTC para garantir consistência
				let dataVencimento = new Date(Date.UTC(ano, mes - 1, fixa.diaVencimento));

				// Ajuste simples para dias inválidos (ex: 31 de fevereiro)
				if (dataVencimento.getUTCMonth() !== mes - 1) {
					dataVencimento = new Date(Date.UTC(ano, mes, 0)); // Último dia do mês
				}

				await despesaRepo.insert({
					descricao: fixa.descricao,
					valor: fixa.valor,
					data: dataVencimento,
					despesaFixaId: fixa.id,
					paga: false,
					fixa: true,
					excluida: false
				});
			}
		}
	}

	@BackendMethod({ allowed: Allow.authenticated })
	static async listarDespesasDoMes(mes: number, ano: number) {
		const despesas = await remult.repo(Despesa).find({
			where: {
				excluida: false
			}
		});

		return despesas
			.filter((despesa) => dataPertenceAoMesAno(despesa.data, mes, ano))
			.sort((a, b) =>
				a.descricao.localeCompare(b.descricao, 'pt-BR', {
					sensitivity: 'base'
				})
			);
	}
}
