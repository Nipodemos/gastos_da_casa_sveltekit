<script lang="ts">
	import DespesasFixas from '../components/DespesasFixas.svelte';
</script>

<div class="relative space-y-8">
	<header>
		<h2
			class="bg-gradient-to-br from-primary-500 to-secondary-500 box-decoration-clone bg-clip-text h2 text-transparent"
		>
			Gerenciamento de Despesas Fixas
		</h2>
		<p class="text-surface-600-400">
			Configure despesas que se repetem mensalmente de forma automática.
		</p>
	</header>

	<DespesasFixas />
</div>
