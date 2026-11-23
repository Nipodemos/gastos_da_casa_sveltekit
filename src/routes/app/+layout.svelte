<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { remult } from 'remult';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	let ehAdmin = $derived(data.isAdmin || remult.isAllowed('admin'));
	let nomeUsuario = $derived(remult.user?.name || data.userName || 'Conta');
	let rotaAtual = $derived(page.url.pathname);

	let linksNavegacao = $derived.by(() => {
		const links: Array<{ href: '/app' | '/app/despesas-fixas' | '/app/usuarios'; label: string; icon: string }> = [
			{ href: '/app', label: 'Dashboard', icon: 'fa-solid fa-chart-pie' },
			{ href: '/app/despesas-fixas', label: 'Despesas Fixas', icon: 'fa-solid fa-calendar-check' }
		];

		if (ehAdmin) {
			links.push({ href: '/app/usuarios', label: 'Usuários', icon: 'fa-solid fa-users-gear' });
		}

		return links;
	});

	function estaAtivo(href: string) {
		return rotaAtual === href;
	}

	onMount(async () => {
		try {
			await remult.initUser();
		} catch (error) {
			console.error('[client] falha ao inicializar remult.user', error);
		}
	});
</script>

<div class="min-h-screen bg-surface-50-950">
	<nav
		class="sticky top-0 z-30 border-b border-surface-200-800 bg-surface-100-900/90 backdrop-blur"
	>
		<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
			<div class="flex flex-wrap items-center gap-1 sm:gap-2">
				{#each linksNavegacao as link (link.href)}
					<a
						href={resolve(link.href)}
						aria-current={estaAtivo(link.href) ? 'page' : undefined}
						class={[
							'inline-flex items-center gap-2 rounded-container px-3 py-2 text-sm transition-colors',
							estaAtivo(link.href)
								? 'bg-primary-500/15 font-semibold text-primary-500'
								: 'text-surface-600-400 hover:bg-surface-200-800 hover:text-surface-900-100'
						]}
					>
						<i class={link.icon} aria-hidden="true"></i>
						<span>{link.label}</span>
					</a>
				{/each}
			</div>

			<div class="flex items-center gap-3">
				<span
					class="inline-flex items-center gap-2 rounded-full border border-surface-200-800 bg-surface-200-800/60 px-3 py-1 text-xs font-medium text-surface-700-300"
					title="Sessão ativa"
				>
					<i class="fa-solid fa-user text-primary-500" aria-hidden="true"></i>
					<span class="max-w-[140px] truncate">{nomeUsuario}</span>
				</span>

				<form method="POST" action="/logout">
					<button
						type="submit"
						class="btn btn-sm preset-outlined-surface-300-700 text-surface-700-300 transition-colors hover:preset-tonal-error"
					>
						<i class="fa-solid fa-right-from-bracket mr-1.5" aria-hidden="true"></i>
						Sair
					</button>
				</form>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl px-4 py-6">
		{@render children?.()}
	</main>
</div>
