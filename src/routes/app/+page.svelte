<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Despesas from './components/Despesas.svelte';
	import Pessoas from './components/Pessoas.svelte';

	// --- Estado Derivado (URL) ---

	/**
	 * A data selecionada obtida da URL (query param 'date').
	 * Se não houver, usa o mês atual.
	 */
	let selectedDate: string = $derived(
		$page.url.searchParams.get('date') || new Date().toISOString().slice(0, 7)
	);

	// --- Estado Compartilhado ---

	/**
	 * O total das despesas, calculado pelo componente Despesas.
	 * Passado para o componente Pessoas para cálculo de contribuição.
	 */
	let totalDespesas: number = $state(0);

	/**
	 * A média de contribuição, calculada pelo componente Pessoas.
	 * Exibida no card de resumo.
	 */
	let averageContribution: number = $state(0);

	// --- Helpers ---

	/**
	 * Navega para o mês anterior ou seguinte.
	 * @param {number} offset - -1 para mês anterior, 1 para mês seguinte.
	 */
	function changeMonth(offset: number) {
		const [year, month] = selectedDate.split('-').map(Number);
		const d = new Date(year, month - 1 + offset, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		goto(`?date=${y}-${m}`);
	}

	/**
	 * Formata a data (ano-mês) para um formato legível (Mês de Ano).
	 * @param {string} dateString - A data no formato 'YYYY-MM'.
	 * @returns {string} A data formatada.
	 */
	function formatMonthYear(dateString: string): string {
		const [year, month] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, 1);
		return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
	}

	/**
	 * Formata um valor numérico para moeda BRL.
	 * @param {number} value - O valor a ser formatado.
	 * @returns {string} O valor formatado.
	 */
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
	}

	/**
	 * Formata um valor numérico para porcentagem.
	 * @param {number} value - O valor a ser formatado.
	 * @returns {string} O valor formatado.
	 */
	function formatPercent(value: number): string {
		return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(
			value
		);
	}
</script>

<div class="relative space-y-8 p-4">
	<!-- Header -->
	<header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h2 class="h2">Dashboard de Despesas da Casa</h2>
			<p class="text-surface-600-400">Um resumo financeiro do seu lar.</p>
		</div>
		<div class="flex items-center gap-2">
			<button class="btn preset-filled-primary-200-800">
				<i class="fa-solid fa-share-nodes mr-2"></i> Compartilhar
			</button>
		</div>
	</header>

	<!-- Summary Cards -->
	<section class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="space-y-2 card preset-outlined-surface-200-800 border-l-4 border-primary-500 p-6">
			<h3 class="h3">Total de Despesas</h3>
			<p class="h1 text-primary-500">{formatCurrency(totalDespesas)}</p>
		</div>
		<div class="space-y-2 card preset-outlined-surface-200-800 border-l-4 border-secondary-500 p-6">
			<h3 class="h3">Proporção de Contribuição</h3>
			<p class="h1 text-secondary-500">
				{formatPercent(averageContribution)}
				<span class="text-base text-surface-600-400">(Média)</span>
			</p>
			<p class="text-sm text-surface-600-400">
				Cada pessoa contribui proporcionalmente ao seu salário líquido.
			</p>
		</div>
	</section>

	<!-- Month Navigation -->
	<div
		class="flex items-center justify-between card border border-surface-200-800 preset-filled-surface-100-900 p-4"
	>
		<button
			class="btn-icon preset-filled-surface-200-800"
			onclick={() => changeMonth(-1)}
			aria-label="Mês anterior"
		>
			<i class="fa-solid fa-chevron-left"></i>
		</button>
		<h3 class="h3 capitalize">{formatMonthYear(selectedDate)}</h3>
		<button
			class="btn-icon preset-filled-surface-200-800"
			onclick={() => changeMonth(1)}
			aria-label="Mês seguinte"
		>
			<i class="fa-solid fa-chevron-right"></i>
		</button>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Left Column: Expenses List (Takes up 2/3 on large screens) -->
		<Despesas {selectedDate} bind:totalDespesas />

		<!-- Right Column: People & Contribution (Takes up 1/3 on large screens) -->
		<Pessoas {totalDespesas} bind:averageContribution />
	</div>
</div>
