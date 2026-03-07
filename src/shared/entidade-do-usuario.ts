import { Allow, remult, type EntityFilter, type EntityOptions, type LifecycleEvent } from 'remult';

const ID_USUARIO_ANONIMO = '__anonymous__';

function obterIdDoUsuarioAtualOuAnonimo() {
	return remult.user?.id ?? ID_USUARIO_ANONIMO;
}

export function aplicarOpcoesDeEntidadeDoUsuario<
	tipoEntidade extends { usuarioId: string }
>(
	opcoes: EntityOptions<tipoEntidade>,
	salvamentoExistente?: (
		entidade: tipoEntidade,
		evento: LifecycleEvent<tipoEntidade>
	) => Promise<void> | void
) {
	opcoes.allowApiCrud = Allow.authenticated;
	opcoes.apiPrefilter = () =>
		({ usuarioId: obterIdDoUsuarioAtualOuAnonimo() }) as EntityFilter<tipoEntidade>;
	opcoes.backendPrefilter = () =>
		({ usuarioId: obterIdDoUsuarioAtualOuAnonimo() }) as EntityFilter<tipoEntidade>;
	opcoes.saving = async (entidade, evento) => {
		const idUsuarioAtual = remult.user?.id;
		if (idUsuarioAtual) {
			entidade.usuarioId = idUsuarioAtual;
		} else if (typeof window === 'undefined') {
			throw new Error('Usuário não autenticado.');
		}

		await salvamentoExistente?.(entidade, evento);
	};
}
