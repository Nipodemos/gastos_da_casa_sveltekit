<script lang="ts">
	import { goto } from '$app/navigation';
	import DespesasFixas from '../components/DespesasFixas.svelte';
</script>

<div class="relative space-y-8 p-4">
	<!-- Header -->
	<header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h2 class="h2">Gerenciamento de Despesas Fixas</h2>
			<p class="text-surface-600-400">
				Configure despesas que se repetem mensalmente de forma automática.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button class="btn preset-filled-surface-200-800" onclick={() => goto('/app')}>
				<i class="fa-solid fa-arrow-left mr-2"></i> Voltar ao Dashboard
			</button>
		</div>
	</header>

	<!-- Fixed Expenses Component -->
	<DespesasFixas />
</div>
