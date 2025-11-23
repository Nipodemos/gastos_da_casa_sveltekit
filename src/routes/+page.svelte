<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let formulario = $state({
		senha: ''
	});
	let submitting = $state(false);
</script>

<div class="flex h-screen w-full items-center justify-center bg-surface-50-950 p-4">
	<div
		class="w-full max-w-sm space-y-6 card border border-surface-200-800 preset-filled-surface-100-900 p-8 shadow-xl"
	>
		<div class="space-y-2 text-center">
			<h1 class="h2 font-bold">Bem-vindo</h1>
			<p class="text-surface-600-400">Digite sua senha para entrar</p>
		</div>

		<form method="POST" use:enhance class="space-y-4">
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
