<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getContext } from 'svelte';
	import type { createToaster } from '@skeletonlabs/skeleton-svelte';

	let { form }: PageProps = $props();
	let formulario = $state({
		senha: ''
	});
	let submitting = $state(false);

	const toaster: ReturnType<typeof createToaster> = getContext('toaster');

	/**
	 * Cria o manipulador do formulário de login com feedback visual por toast.
	 */
	const criarManipuladorDeLogin: SubmitFunction = () => {
		return async ({ result, update }) => {
			submitting = true;

			const promise = (async () => {
				if (result.type === 'failure') {
					throw result.data?.error || 'Erro desconhecido';
				} else if (result.type === 'redirect' || result.type === 'success') {
					// Sucesso
					return;
				} else {
					// Outros casos (error, etc)
					throw 'Erro inesperado';
				}
			})();

			toaster.promise(promise, {
				loading: {
					description: 'Verificando credenciais...',
					meta: {
						icon: 'fa-solid fa-spinner fa-spin'
					}
				},
				success: {
					description: 'Login realizado com sucesso!',
					meta: { icon: 'fa-solid fa-check' }
				},
				error: {
					description: 'Erro ao entrar.',
					meta: { icon: 'fa-solid fa-exclamation' }
				}
			});

			try {
				await promise;
			} catch {
				// O toaster.promise já lida com o erro visualmente
			} finally {
				submitting = false;
				await update();
			}
		};
	};
</script>

<div class="flex h-screen w-full items-center justify-center bg-surface-50-950 p-4">
	<div
		class="w-full max-w-sm space-y-6 card border border-surface-200-800 preset-filled-surface-100-900 p-8 shadow-xl"
	>
		<div class="space-y-2 text-center">
			<h1 class="h2 font-bold">Bem-vindo</h1>
			<p class="text-surface-600-400">Digite sua senha para entrar no seu espaço</p>
			<p class="text-sm text-surface-500">
				Se essa senha ainda não existir, uma conta nova será criada sem tela de cadastro.
			</p>
		</div>

		<form method="POST" use:enhance={criarManipuladorDeLogin} class="space-y-4">
			<label class="label space-y-2">
				<span class="font-medium">Senha</span>
				<input
					name="senha"
					type="password"
					class="input w-full rounded-container preset-filled-surface-200-800 p-3"
					placeholder="********"
					bind:value={formulario.senha}
				/>
			</label>

			<button
				type="submit"
				class="btn w-full rounded-container preset-filled-primary-500 py-3 font-bold"
				disabled={submitting}
			>
				{submitting ? 'Entrando...' : 'Entrar'}
			</button>

			{#if form?.error}
				<div class="alert rounded-container preset-tonal-error p-4 text-center">
					<p>{form.error}</p>
				</div>
			{/if}
		</form>
	</div>
</div>
