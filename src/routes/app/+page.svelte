<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PessoaCalculada } from '$lib/types';
	import Despesas from './components/Despesas.svelte';
	import Pessoas from './components/Pessoas.svelte';

	// --- Estado Derivado (URL) ---

	/**
	 * A data selecionada obtida da URL (query param 'date').
	 * Se não houver, usa o mês atual.
	 */
	let selectedDate: string = $derived(
		page.url.searchParams.get('date') || new Date().toISOString().slice(0, 7)
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

	/**
	 * Informações detalhadas das pessoas e seus cálculos.
	 * Obtido do componente Pessoas via bind.
	 */
	let pessoasInfo: PessoaCalculada[] = $state([]);

	/**
	 * Receita total da casa.
	 * Obtido do componente Pessoas via bind.
	 */
	let receitaTotal: number = $state(0);

	// --- Estado UI ---

	let shareButtonText = $state('Compartilhar');
	let shareButtonClass = $state('preset-filled-primary-200-800');

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
		return new Intl.NumberFormat('pt-BR', {
			style: 'percent',
			minimumFractionDigits: 2
		}).format(value);
	}

	/**
	 * Gera o texto de resumo e copia para a área de transferência.
	 */
	async function handleShare() {
		const [year, month] = selectedDate.split('-');
		const dateObj = new Date(Number(year), Number(month) - 1);
		const monthName = dateObj.toLocaleString('pt-BR', { month: 'long' });
		const header = `*Resumo de Despesas da Casa - ${monthName}/${year}*`;

		let body = '';
		pessoasInfo.forEach((p) => {
			body += `*${p.nome}*: ${formatCurrency(p.valorAPagar)}\n`;
		});

		const footer = `
*Despesas da Casa*: ${formatCurrency(totalDespesas)}
*Receita da Casa (Total Pessoas)*: ${formatCurrency(receitaTotal)}
*Contribuição sobre Renda*: ${formatPercent(averageContribution)}`;

		const textToCopy = `${header}\n\n${body}${footer}`;

		try {
			await navigator.clipboard.writeText(textToCopy);

			const originalClass = 'preset-filled-primary-200-800';

			shareButtonText = 'Copiado!';
			shareButtonClass = 'preset-filled-success-500';

			setTimeout(() => {
				shareButtonText = 'Compartilhar';
				shareButtonClass = originalClass;
			}, 1500);
		} catch (err) {
			console.error('Failed to copy: ', err);
			alert('Falha ao copiar para a área de transferência.');
		}
	}
</script>

<div class="relative space-y-8 p-4">
	<!-- Header -->
	<header class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h2
				class="bg-gradient-to-br from-primary-500 to-secondary-500 box-decoration-clone bg-clip-text h2 text-transparent"
			>
				Dashboard de Despesas
			</h2>
			<p class="text-surface-600-400">Um resumo financeiro do seu lar.</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="btn preset-filled-secondary-200-800 transition-all hover:brightness-110"
				onclick={() => goto('/app/despesas-fixas')}
			>
				<i class="fa-solid fa-calendar-check mr-2"></i> Despesas Fixas
			</button>
			<button
				class="btn {shareButtonClass} transition-all hover:brightness-110"
				onclick={handleShare}
			>
				{#if shareButtonText === 'Compartilhar'}
					<i class="fa-solid fa-share-nodes mr-2"></i>
				{:else}
					<i class="fa-solid fa-check mr-2"></i>
				{/if}
				{shareButtonText}
			</button>
		</div>
	</header>

	<!-- Summary Cards -->
	<section class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div
			class="space-y-2 card preset-outlined-surface-200-800 border-l-4 border-primary-500 p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
		>
			<h3 class="h3">Total de Despesas</h3>
			<p class="h1 text-primary-500">{formatCurrency(totalDespesas)}</p>
		</div>
		<div
			class="space-y-2 card preset-outlined-surface-200-800 border-l-4 border-secondary-500 p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
		>
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

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Left Column: Expenses List (Takes up 2/3 on large screens) -->
		<Despesas {selectedDate} bind:totalDespesas />

		<!-- Right Column: People & Contribution (Takes up 1/3 on large screens) -->
		<Pessoas {totalDespesas} bind:averageContribution bind:pessoasInfo bind:receitaTotal />
	</div>
</div>
