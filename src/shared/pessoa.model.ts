import { Entity, Fields, Validators } from 'remult';
import { calculateInssValue } from '$lib/utils/inss';

@Entity<Pessoa>('pessoas', {
	allowApiCrud: true,
	saving: (pessoa) => {
		const baseCalculo = (pessoa.salarioBruto || 0);

		const valorInss = calculateInssValue(baseCalculo);
		
		if (baseCalculo > 0 && pessoa.clt) {
			// 1ª faixa: até R$ 1.518,00 -> 7,5%
			// 2ª faixa: de R$ 1.518,01 até R$ 2.793,88 -> 9%
			// 3ª faixa: de R$ 2.793,89 até R$ 4.190,83 -> 12%
			// 4ª faixa: de R$ 4.190,84 até R$ 8.157,41 -> 14%
			if (baseCalculo <= 1518) {
				pessoa.porcentagemTaxaInss = 0.075;
			} else if (baseCalculo <= 2793.88) {
				pessoa.porcentagemTaxaInss = 0.09;
			} else if (baseCalculo <= 4190.83) {
				pessoa.porcentagemTaxaInss = 0.12;
			} else {
				pessoa.porcentagemTaxaInss = 0.14;
			}
		} else {
			pessoa.porcentagemTaxaInss = 0;
		}

		const descontoAlimentacao = (pessoa.salarioBruto || 0) * (pessoa.porcentagemTaxaAlimentacao || 0);
		const descontoPassagem = (pessoa.salarioBruto || 0) * (pessoa.porcentagemTaxaPassagem || 0);

		pessoa.salarioLiquido = baseCalculo +pessoa.valorTicketAlimentacao + pessoa.bonus - valorInss - descontoAlimentacao - descontoPassagem;

		if (pessoa.salarioLiquido < 0) {
			pessoa.salarioLiquido = 0;
		}
	}
})
export class Pessoa {
	@Fields.id()
	id: string = '';

	@Fields.string({ required: true, minLength: 3, maxLength: 100 })
	nome: string = '';

	@Fields.number({ required: true, validate: Validators.min(1) })
	salarioBruto: number = 0;

	@Fields.number({ required: true, defaultValue: () => 0, validate: Validators.min(0) })
	bonus: number = 0;

	@Fields.number({
		required: true,
		defaultValue: () => 0,
		validate: [Validators.min(0), Validators.max(1)]
	})
	porcentagemTaxaAlimentacao: number = 0;

	@Fields.number({
		allowApiUpdate: false,
		defaultValue: () => 0,
		validate: [Validators.min(0), Validators.max(1)]
	})
	porcentagemTaxaInss: number = 0;

	@Fields.number({
		required: true,
		defaultValue: () => 0,
		validate: [Validators.min(0), Validators.max(1)]
	})
	porcentagemTaxaPassagem: number = 0;

	@Fields.number({ required: true, defaultValue: () => 0 })
	valorTicketAlimentacao: number = 0;

	@Fields.number({ allowApiUpdate: false, validate: Validators.min(0) })
	salarioLiquido: number = 0;

	@Fields.boolean()
	clt: boolean = true;

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
