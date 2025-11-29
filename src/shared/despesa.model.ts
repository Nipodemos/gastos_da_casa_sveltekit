import { Entity, Fields, Validators } from 'remult';

@Entity<Despesa>('despesas', {
	allowApiCrud: true
})
export class Despesa {
	@Fields.id()
	id: string = '';

	@Fields.string({ required: true, minLength: 3, maxLength: 100 })
	descricao: string = '';

	@Fields.number({ required: true, validate: Validators.min(0.01) })
	valor: number = 0;

	@Fields.dateOnly({ required: true })
	data: Date = new Date();

	@Fields.boolean()
	paga: boolean = false;

	@Fields.boolean({ allowApiUpdate: false })
	fixa: boolean = false;

	@Fields.string()
	despesaFixaId: string = '';

	@Fields.boolean()
	excluida: boolean = false;

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
