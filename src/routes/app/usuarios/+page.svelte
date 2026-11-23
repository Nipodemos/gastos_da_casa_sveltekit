<script lang="ts">
	import { enhance } from '$app/forms';
	import { createToaster } from '@skeletonlabs/skeleton-svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getContext } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const toaster = getContext<ReturnType<typeof createToaster>>('toaster');

	let salvando: boolean = $state(false);
	let excluindoId: string | null = $state(null);

	let nome: string = $state('');
	let senha: string = $state('');
	let confirmarSenha: string = $state('');

	const criarUsuarioSubmit: SubmitFunction = () => {
		salvando = true;

		return async ({ result, update }) => {
			try {
				await update();
				if (result.type === 'success') {
					nome = '';
					senha = '';
					confirmarSenha = '';
					toaster.create({
						description: 'Usuário criado com sucesso!',
						type: 'success'
					});
				}
			} finally {
				salvando = false;
			}
		};
	};

	const excluirUsuarioSubmit = (usuarioId: string, usuarioNome: string): SubmitFunction => {
		return ({ cancel }) => {
			if (!confirm(`Tem certeza que deseja excluir o usuário "${usuarioNome}"?`)) {
				cancel();
				return;
			}

			excluindoId = usuarioId;
			return async ({ result, update }) => {
				try {
					await update();
					if (result.type === 'success') {
						toaster.create({
							description: 'Usuário excluído com sucesso!',
							type: 'success'
						});
					} else if (result.type === 'failure') {
						toaster.create({
							description:
								(result.data?.erro as string) || 'Erro ao excluir usuário.',
							type: 'error'
						});
					}
				} finally {
					excluindoId = null;
				}
			};
		};
	};

	function formatarData(valor?: Date | string): string {
		if (!valor) return '-';
		return new Date(valor).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-8">
	<header>
		<h2
			class="bg-gradient-to-br from-primary-500 to-secondary-500 box-decoration-clone bg-clip-text h2 text-transparent"
		>
			Gerenciamento de Usuários
		</h2>
		<p class="text-surface-600-400">
			Área restrita ao administrador para criar contas isoladas no sistema.
		</p>
	</header>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<section
			class="space-y-4 card border border-surface-200-800 preset-outlined-surface-200-800 p-6 shadow-sm"
		>
			<div>
				<h3 class="h3">Novo Usuário</h3>
				<p class="text-sm text-surface-600-400">
					Cada usuário terá seu próprio espaço com despesas e pessoas isoladas.
				</p>
			</div>

			<form method="POST" action="?/criar" use:enhance={criarUsuarioSubmit} class="space-y-4">
				<label class="label">
					<span>Nome</span>
					<input
						name="nome"
						class="input"
						type="text"
						placeholder="Ex: Casa da Maria"
						bind:value={nome}
						minlength="3"
						maxlength="100"
						required
					/>
				</label>

				<label class="label">
					<span>Senha de acesso</span>
					<input
						name="senha"
						class="input"
						type="password"
						placeholder="Mínimo 4 caracteres"
						bind:value={senha}
						minlength="4"
						required
					/>
				</label>

				<label class="label">
					<span>Confirmar senha</span>
					<input
						name="confirmarSenha"
						class="input"
						type="password"
						placeholder="Repita a senha"
						bind:value={confirmarSenha}
						minlength="4"
						required
					/>
				</label>

				{#if form?.erro}
					<div class="alert rounded-container preset-tonal-error p-3 text-sm">
						<p>{form.erro}</p>
					</div>
				{:else if form?.sucesso}
					<div class="alert rounded-container preset-tonal-success p-3 text-sm">
						<p>{form.sucesso}</p>
					</div>
				{/if}

				<button
					type="submit"
					class="btn w-full preset-filled-primary-500 font-semibold"
					disabled={salvando}
				>
					{#if salvando}
						<i class="fa-solid fa-spinner fa-spin mr-2"></i> Criando...
					{:else}
						<i class="fa-solid fa-user-plus mr-2"></i> Criar Usuário
					{/if}
				</button>
			</form>
		</section>

		<section
			class="space-y-4 card border border-surface-200-800 preset-outlined-surface-200-800 p-6 shadow-sm lg:col-span-2"
		>
			<div class="flex items-center justify-between">
				<div>
					<h3 class="h3">Usuários Cadastrados</h3>
					<p class="text-sm text-surface-600-400">
						Contas que possuem acesso à aplicação.
					</p>
				</div>
				<span class="badge preset-filled-surface-200-800">{data.usuarios.length}</span>
			</div>

			<div class="overflow-hidden rounded-container border border-surface-200-800">
				<div
					class="hidden grid-cols-[minmax(0,1fr)_130px_90px] items-center gap-3 bg-surface-300-700 px-4 py-3 text-sm font-semibold md:grid"
				>
					<div>Nome</div>
					<div>Criado em</div>
					<div class="text-right">Ações</div>
				</div>

				{#if data.usuarios.length === 0}
					<div class="p-4 text-center text-surface-500">Nenhum usuário cadastrado.</div>
				{:else}
					<div class="space-y-2 p-2 md:space-y-0 md:p-0">
						{#each data.usuarios as usuario (usuario.id)}
							<div
								class="rounded-container border border-surface-200-800 p-3 odd:bg-surface-100-900 even:bg-surface-200-800 md:grid md:grid-cols-[minmax(0,1fr)_130px_90px] md:items-center md:gap-3 md:rounded-none md:border-0 md:px-4 md:py-3"
							>
								<div class="flex items-center justify-between gap-2 md:justify-start">
									<span class="truncate font-medium">{usuario.nome}</span>
									{#if usuario.id === data.usuarioAtualId}
										<span class="badge preset-filled-primary-500 text-xs">
											Você
										</span>
									{/if}
								</div>

								<div class="mt-1 text-sm text-surface-600-400 md:mt-0">
									{formatarData(usuario.createdAt)}
								</div>

								<div class="mt-2 flex justify-end md:mt-0">
									{#if usuario.id !== data.usuarioAtualId}
										<form
											method="POST"
											action="?/excluir"
											use:enhance={excluirUsuarioSubmit(
												usuario.id,
												usuario.nome
											)}
										>
											<input type="hidden" name="usuarioId" value={usuario.id} />
											<button
												type="submit"
												class="btn-icon btn-icon-sm preset-filled-error-300-700"
												title="Excluir usuário"
												aria-label="Excluir usuário"
												disabled={excluindoId === usuario.id}
											>
												{#if excluindoId === usuario.id}
													<i class="fa-solid fa-spinner fa-spin"></i>
												{:else}
													<i class="fa-solid fa-trash"></i>
												{/if}
											</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>
