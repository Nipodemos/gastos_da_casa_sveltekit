import { fail, redirect } from '@sveltejs/kit';
import { remult } from 'remult';
import { Usuario } from '$shared/usuario.model';
import { gerarHashCodigoDeAcesso, verificarCodigoDeAcesso } from '../../../server/auth';
import type { Actions, PageServerLoad } from './$types';

export interface UsuarioResumo {
	id: string;
	nome: string;
	createdAt?: Date;
}

/**
 * Restringe o gerenciamento de usuários apenas a administradores e carrega a lista inicial.
 */
export const load: PageServerLoad = async () => {
	if (!remult.isAllowed('admin')) {
		throw redirect(303, '/app');
	}

	const usuarios = await remult.repo(Usuario).find({
		orderBy: { createdAt: 'desc' }
	});

	return {
		usuarioAtualId: remult.user?.id ?? '',
		usuarios: usuarios.map(
			(usuario): UsuarioResumo => ({
				id: usuario.id,
				nome: usuario.nome,
				createdAt: usuario.createdAt
			})
		)
	};
};

export const actions: Actions = {
	criar: async ({ request }) => {
		if (!remult.isAllowed('admin')) {
			return fail(403, { erro: 'Acesso restrito a administradores.' });
		}

		const data = await request.formData();
		const nome = data.get('nome')?.toString().trim() ?? '';
		const senha = data.get('senha')?.toString().trim() ?? '';
		const confirmarSenha = data.get('confirmarSenha')?.toString().trim() ?? '';

		if (nome.length < 3 || nome.length > 100) {
			return fail(400, { nome, erro: 'O nome deve ter entre 3 e 100 caracteres.' });
		}

		if (senha.length < 4) {
			return fail(400, { nome, erro: 'A senha deve ter pelo menos 4 caracteres.' });
		}

		if (senha !== confirmarSenha) {
			return fail(400, { nome, erro: 'As senhas não conferem.' });
		}

		const repo = remult.repo(Usuario);
		const usuariosExistentes = await repo.find();
		const senhaJaEmUso = usuariosExistentes.some((usuario) =>
			verificarCodigoDeAcesso(senha, usuario.senhaHash)
		);

		if (senhaJaEmUso) {
			return fail(400, {
				nome,
				erro: 'Já existe um usuário com essa senha. Como o login usa apenas a senha, escolha uma senha diferente.'
			});
		}

		await repo.insert({
			nome,
			senhaHash: gerarHashCodigoDeAcesso(senha)
		});

		return { sucesso: `Usuário "${nome}" criado com sucesso!` };
	},

	excluir: async ({ request }) => {
		if (!remult.isAllowed('admin')) {
			return fail(403, { erro: 'Acesso restrito a administradores.' });
		}

		const data = await request.formData();
		const usuarioId = data.get('usuarioId')?.toString().trim() ?? '';

		if (!usuarioId) {
			return fail(400, { erro: 'Usuário inválido.' });
		}

		if (usuarioId === remult.user?.id) {
			return fail(400, {
				erro: 'Você não pode excluir a própria conta enquanto estiver logado nela.'
			});
		}

		await remult.repo(Usuario).delete(usuarioId);

		return { sucesso: 'Usuário excluído com sucesso!' };
	}
};
