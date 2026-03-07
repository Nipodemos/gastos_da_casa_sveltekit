<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form }: PageProps = $props();
	let formulario = $state({
		senha: ''
	});
	let submitting = $state(false);

	/**
	 * Cria o manipulador do formulário de login com feedback visual inline.
	 */
	const criarManipuladorDeLogin: SubmitFunction = () => {
		submitting = true;

		return async ({ update }) => {
			try {
				await update();
			} finally {
				submitting = false;
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
				Use a senha de um usuário existente ou a senha administrativa definida no `.env`.
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

			{#if submitting}
				<div
					class="alert rounded-container preset-tonal-primary p-4 text-center text-sm text-surface-700-300"
				>
					<p class="flex items-center justify-center gap-2">
						<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
						<span>Verificando credenciais...</span>
					</p>
				</div>
			{:else if form?.error}
				<div class="alert rounded-container preset-tonal-error p-4 text-center">
					<p>{form.error}</p>
				</div>
			{/if}
		</form>
	</div>
</div>
