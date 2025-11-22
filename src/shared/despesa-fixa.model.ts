import { Entity, Fields, Validators } from 'remult';

@Entity<DespesaFixa>('despesasFixas', {
	allowApiCrud: true
})
export class DespesaFixa {
	@Fields.id()
	id: string = '';

	@Fields.string({ required: true, minLength: 3, maxLength: 100 })
	descricao: string = '';

	@Fields.number({ required: true, validate: Validators.min(0.01) })
	valor: number = 0;

	@Fields.integer({ required: true, validate: [Validators.min(1), Validators.max(31)] })
	diaVencimento: number = 1;

	@Fields.boolean()
	ativa: boolean = true;

    @Fields.dateOnly()
    inicio: Date = new Date();

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
