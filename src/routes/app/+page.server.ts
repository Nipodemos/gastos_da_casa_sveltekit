import { remult } from 'remult';
import { Despesa } from '../../shared/despesa.model';
import { Pessoa } from '../../shared/pessoa.model';

export const load = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	let date = new Date();

	if (dateParam) {
		const [year, month] = dateParam.split('-').map(Number);
		if (!isNaN(year) && !isNaN(month)) {
			date = new Date(year, month - 1, 1);
		}
	}

	const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

	const despesasRepo = remult.repo(Despesa);
	const pessoasRepo = remult.repo(Pessoa);

	const [despesas, pessoas] = await Promise.all([
		despesasRepo.find({
			where: {
				data: {
					$gte: startOfMonth,
					$lte: endOfMonth
				},
				excluida: false
			},
			orderBy: {
				data: 'asc'
			}
		}),
		pessoasRepo.find({
			orderBy: {
				nome: 'asc'
			}
		})
	]);

	return {
		despesas,
		pessoas,
		selectedDate: date.toISOString().slice(0, 7) // YYYY-MM
	};
};
