import { Entity, Fields, Validators } from 'remult';

@Entity<Pessoa>('pessoas', {
	allowApiCrud: true
})
export class Pessoa {
	@Fields.id()
	id: string = '';

	@Fields.string({ required: true, minLength: 3, maxLength: 100 })
	nome: string = '';

	@Fields.number({ required: true, validate: Validators.min(0.01) })
	salarioBruto: number = 0;

	@Fields.number({
		required: true,
		defaultValue: () => 0,
		validate: [Validators.min(0), Validators.max(1)]
	})
	porcentagemTaxaAlimentacao: number = 0;

	@Fields.number({
		required: true,
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

	@Fields.number({ required: true, validate: Validators.min(0) })
	salarioLiquido: number = 0;

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
