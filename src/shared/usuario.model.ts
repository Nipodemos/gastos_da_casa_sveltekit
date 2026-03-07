import { Entity, Fields } from 'remult';

@Entity<Usuario>('usuarios', {
	allowApiCrud: false
})
export class Usuario {
	@Fields.id()
	id: string = '';

	@Fields.string({ required: true, minLength: 3, maxLength: 100 })
	nome: string = '';

	@Fields.string({ includeInApi: false, allowApiUpdate: false })
	senhaHash: string = '';

	@Fields.createdAt()
	createdAt?: Date;

	@Fields.updatedAt()
	updatedAt?: Date;
}
