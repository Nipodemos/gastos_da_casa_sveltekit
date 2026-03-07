import { Allow, BackendMethod, remult } from 'remult';
import { Despesa } from '../shared/despesa.model';
import { DespesaFixa } from '../shared/despesa-fixa.model';

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

		// 2. Definir o intervalo do mês
		// 2. Definir o intervalo do mês em UTC para evitar problemas de fuso horário
		const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
		const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
		for (const fixa of fixas) {
			// Verificar se a despesa fixa começou antes ou durante este mês
			if (fixa.inicio && fixa.inicio > fimMes) {
				continue;
			}

			// 3. Verificar se já existe uma despesa gerada para esta fixa neste mês
			// Importante: Buscamos inclusive as excluídas (soft delete) para não recriar
			const existente = await despesaRepo.findFirst({
				despesaFixaId: fixa.id,
				data: { $gte: inicioMes, $lte: fimMes }
			});

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
}
