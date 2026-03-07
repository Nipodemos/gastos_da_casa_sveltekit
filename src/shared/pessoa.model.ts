import { Entity, Fields, Validators } from 'remult';
import { calculateInssValue } from '$lib/utils/inss';
import { aplicarOpcoesDeEntidadeDoUsuario } from './entidade-do-usuario';

@Entity<Pessoa>('pessoas', (options) => {
	aplicarOpcoesDeEntidadeDoUsuario(options, (pessoa) => {
		const baseCalculo = pessoa.salarioBruto || 0;

		if (baseCalculo > 0 && pessoa.clt) {
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
	});
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

	// @Fields.number({ allowApiUpdate: false, validate: Validators.min(0) })
	get salarioLiquido(): number {
		const baseCalculo = this.salarioBruto || 0;
		const valorInss = calculateInssValue(baseCalculo, this.clt);
		const descontoAlimentacao = baseCalculo * (this.porcentagemTaxaAlimentacao || 0);
		const descontoPassagem = baseCalculo * (this.porcentagemTaxaPassagem || 0);

		const liquido =
			baseCalculo +
			this.valorTicketAlimentacao +
			this.bonus -
			valorInss -
			descontoAlimentacao -
			descontoPassagem;

		return liquido < 0 ? 0 : liquido;
	}

	@Fields.boolean()
	clt: boolean = true;

	@Fields.string({ includeInApi: false, allowApiUpdate: false })
	usuarioId: string = '';

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
