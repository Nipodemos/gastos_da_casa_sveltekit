<script lang="ts">
	import { remult } from 'remult';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(async () => {
		console.log('[client] remult.user antes do initUser()', remult.user);

		try {
			const usuario = await remult.initUser();
			console.log('[client] remult.user depois do initUser()', remult.user);
			console.log('[client] usuario retornado por initUser()', usuario);
		} catch (error) {
			console.error('[client] falha ao inicializar remult.user', error);
		}
	});
</script>

<div class="min-h-screen bg-surface-50-950">
	<div class="border-b border-surface-200-800 bg-surface-100-900/80 backdrop-blur">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
			<div>
				<p class="text-xs tracking-[0.2em] text-surface-500 uppercase">Sessão ativa</p>
				<p class="font-semibold text-surface-900-100">{remult.user?.name ?? 'SEM NOME'}</p>
			</div>

			<form method="POST" action="/logout">
				<button type="submit" class="btn preset-filled-surface-200-800">
					<i class="fa-solid fa-right-from-bracket mr-2"></i>
					Sair
				</button>
			</form>
		</div>
	</div>

	{@render children?.()}
</div>
