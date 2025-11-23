<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let { despesas, pessoas, selectedDate } = $derived(data);

	// --- Derived State (Calculations) ---
	let totalDespesas = $derived(despesas.reduce((acc, d) => acc + d.valor, 0));
	let totalReceita = $derived(pessoas.reduce((acc, p) => acc + p.salarioLiquido, 0));

	let pessoasCalculadas = $derived(
		pessoas.map((p) => {
			const porcentagemContribuicao = totalReceita > 0 ? p.salarioLiquido / totalReceita : 0;
			const valorAPagar = totalDespesas * porcentagemContribuicao;
			const sobraSalario = p.salarioLiquido - valorAPagar;

			return {
				...p,
				porcentagemContribuicao,
				valorAPagar,
				sobraSalario
			};
		})
	);

	let averageContribution = $derived(
		pessoasCalculadas.length > 0
			? pessoasCalculadas.reduce((acc, p) => acc + p.porcentagemContribuicao, 0) /
					pessoasCalculadas.length
			: 0
	);

	// --- Event Handlers ---
	function changeMonth(offset: number) {
		const [year, month] = selectedDate.split('-').map(Number);
		const d = new Date(year, month - 1 + offset, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		goto(`?date=${y}-${m}`);
	}

	function formatMonthYear(dateString: string) {
		const [year, month] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, 1);
		return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
	}

	function formatPercent(value: number) {
		return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(
			value
		);
	}
</script>

<div class="space-y-8 p-4">
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
		<div class="space-y-4 lg:col-span-2">
			<div class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4">
				<div class="flex items-center justify-between">
					<h3 class="h3">Despesas do Mês</h3>
					<a href="/app/despesas/criar" class="btn preset-filled-primary-200-800">
						<i class="fa-solid fa-plus mr-2"></i> Adicionar Despesa
					</a>
				</div>

				<div class="table-container overflow-hidden rounded-container">
					<table class="table-hover table">
						<thead class="bg-surface-200-800">
							<tr>
								<th>Descrição</th>
								<th class="text-right">Valor</th>
								<th class="text-right">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each despesas as despesa}
								<tr>
									<td>{despesa.descricao}</td>
									<td class="text-right font-bold text-error-500">
										- {formatCurrency(despesa.valor)}
									</td>
									<td class="space-x-2 text-right">
										<a
											href="/app/despesas/{despesa.id}"
											class="btn-icon btn-icon-sm preset-outlined-primary-200-800"
											title="Editar"
											aria-label="Editar"
										>
											<i class="fa-solid fa-pen"></i>
										</a>
										<button
											class="btn-icon btn-icon-sm preset-outlined-error-200-800"
											title="Excluir"
											aria-label="Excluir"
										>
											<i class="fa-solid fa-trash"></i>
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="3" class="text-center p-4 text-surface-500">
										Nenhuma despesa encontrada para este mês.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Right Column: People & Contribution (Takes up 1/3 on large screens) -->
		<div class="space-y-4">
			<div class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4">
				<div class="flex items-center justify-between">
					<h3 class="h3">Pessoas e Salários</h3>
					<a href="/app/pessoas/criar" class="btn preset-filled-primary-200-800">
						<i class="fa-solid fa-plus mr-2"></i> Adicionar Pessoa
					</a>
				</div>

				<div class="space-y-4">
					{#each pessoasCalculadas as pessoa}
						<div
							class="space-y-4 card border border-surface-200-800 preset-filled-surface-200-800 p-4"
						>
							<div class="flex items-center justify-between border-b border-surface-200-800 pb-2">
								<h4 class="h4 font-bold">{pessoa.nome}</h4>
								<div class="space-x-1">
									<a
										href="/app/pessoas/{pessoa.id}"
										class="btn-icon btn-icon-sm preset-outlined-primary-200-800"
										title="Editar"
										aria-label="Editar"
									>
										<i class="fa-solid fa-pen"></i>
									</a>
									<button
										class="btn-icon btn-icon-sm preset-outlined-error-200-800"
										title="Excluir"
										aria-label="Excluir"
									>
										<i class="fa-solid fa-trash"></i>
									</button>
								</div>
							</div>

							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-surface-600-400">Valor a pagar:</span>
									<span class="font-bold text-error-500">{formatCurrency(pessoa.valorAPagar)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-surface-600-400">Sobra do Salário:</span>
									<span class="font-bold text-success-500"
										>{formatCurrency(pessoa.sobraSalario)}</span
									>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-surface-600-400">Contribuição (% Renda):</span>
									<span class="badge preset-filled-surface-500">
										{formatPercent(pessoa.porcentagemContribuicao)}
									</span>
								</div>
							</div>
						</div>
					{:else}
						<div
							class="card p-4 text-center text-surface-500 preset-filled-surface-200-800 border border-surface-200-800"
						>
							Nenhuma pessoa cadastrada.
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
