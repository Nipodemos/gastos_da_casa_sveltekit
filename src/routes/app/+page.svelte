<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { remult } from 'remult';
	import { Despesa } from '../../shared/despesa.model';
	import { Pessoa } from '../../shared/pessoa.model';
	import { DespesasController } from '../../server/despesas.controller';

	// --- State ---
	let despesas: Despesa[] = $state([]);
	let pessoas: Pessoa[] = $state([]);
	let loading = $state(false);

	// Modals state
	let showDespesaModal = $state(false);
	let editingDespesa: Despesa | null = $state(null);
	let despesaForm = $state({
		descricao: '',
		valor: 0,
		data: new Date().toISOString().slice(0, 10),
		paga: false
	});

	let showPessoaModal = $state(false);
	let editingPessoa: Pessoa | null = $state(null);
	let pessoaForm = $state({
		nome: '',
		salarioBruto: 0,
		bonus: 0,
		porcentagemTaxaAlimentacao: 0,
		porcentagemTaxaPassagem: 0,
		valorTicketAlimentacao: 0,
		clt: true
	});

	// --- Derived State (URL) ---
	let selectedDate = $derived(
		$page.url.searchParams.get('date') || new Date().toISOString().slice(0, 7)
	);

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

	// --- Effects ---
	$effect(() => {
		loadData(selectedDate);
	});

	// --- Data Loading ---
	async function loadData(dateStr: string) {
		loading = true;
		try {
			const [year, month] = dateStr.split('-').map(Number);

			// Ensure fixed expenses are generated
			await DespesasController.garantirDespesasFixas(month, year);

			const startOfMonth = new Date(year, month - 1, 1);
			const endOfMonth = new Date(year, month, 0);
			// Adjust endOfMonth to cover the whole day
			endOfMonth.setHours(23, 59, 59, 999);

			despesas = await remult.repo(Despesa).find({
				where: {
					data: { $gte: startOfMonth, $lte: endOfMonth },
					excluida: false
				},
				orderBy: { data: 'asc' }
			});

			pessoas = await remult.repo(Pessoa).find({
				orderBy: { nome: 'asc' }
			});
		} catch (error) {
			console.error('Error loading data:', error);
			alert('Erro ao carregar dados.');
		} finally {
			loading = false;
		}
	}

	// --- Actions: Despesas ---
	function openAddDespesa() {
		editingDespesa = null;
		despesaForm = {
			descricao: '',
			valor: 0,
			data: new Date().toISOString().slice(0, 10), // Today
			paga: false
		};
		// If adding in a specific month, default to that month's 1st day (or today if same month)
		const [year, month] = selectedDate.split('-').map(Number);
		const today = new Date();
		if (today.getMonth() + 1 !== month || today.getFullYear() !== year) {
			despesaForm.data = `${year}-${String(month).padStart(2, '0')}-01`;
		}

		showDespesaModal = true;
	}

	function openEditDespesa(despesa: Despesa) {
		editingDespesa = despesa;
		despesaForm = {
			descricao: despesa.descricao,
			valor: despesa.valor,
			data: new Date(despesa.data).toISOString().slice(0, 10),
			paga: despesa.paga
		};
		showDespesaModal = true;
	}

	async function saveDespesa() {
		try {
			const repo = remult.repo(Despesa);
			// Fix timezone offset issue by setting time to noon or handling it as UTC
			// Simple approach: create date and ensure it's the correct day
			const [y, m, d] = despesaForm.data.split('-').map(Number);
			const dateObj = new Date(y, m - 1, d);

			if (editingDespesa) {
				await repo.update(editingDespesa.id, {
					...despesaForm,
					data: dateObj
				});
			} else {
				await repo.insert({
					...despesaForm,
					data: dateObj,
					excluida: false
				});
			}
			showDespesaModal = false;
			await loadData(selectedDate);
		} catch (error) {
			console.error('Error saving despesa:', error);
			alert('Erro ao salvar despesa.');
		}
	}

	async function deleteDespesa(despesa: Despesa) {
		if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
		try {
			await remult.repo(Despesa).delete(despesa.id);
			await loadData(selectedDate);
		} catch (error) {
			console.error('Error deleting despesa:', error);
			alert('Erro ao excluir despesa.');
		}
	}

	// --- Actions: Pessoas ---
	function openAddPessoa() {
		editingPessoa = null;
		pessoaForm = {
			nome: '',
			salarioBruto: 0,
			bonus: 0,
			porcentagemTaxaAlimentacao: 0,
			porcentagemTaxaPassagem: 0,
			valorTicketAlimentacao: 0,
			clt: true
		};
		showPessoaModal = true;
	}

	function openEditPessoa(pessoa: Pessoa) {
		editingPessoa = pessoa;
		pessoaForm = {
			nome: pessoa.nome,
			salarioBruto: pessoa.salarioBruto,
			bonus: pessoa.bonus,
			porcentagemTaxaAlimentacao: pessoa.porcentagemTaxaAlimentacao,
			porcentagemTaxaPassagem: pessoa.porcentagemTaxaPassagem,
			valorTicketAlimentacao: pessoa.valorTicketAlimentacao,
			clt: pessoa.clt
		};
		showPessoaModal = true;
	}

	async function savePessoa() {
		try {
			const repo = remult.repo(Pessoa);
			if (editingPessoa) {
				await repo.update(editingPessoa.id, { ...pessoaForm });
			} else {
				await repo.insert({ ...pessoaForm });
			}
			showPessoaModal = false;
			await loadData(selectedDate);
		} catch (error) {
			console.error('Error saving pessoa:', error);
			alert('Erro ao salvar pessoa.');
		}
	}

	async function deletePessoa(pessoa: Pessoa) {
		if (!confirm('Tem certeza que deseja excluir esta pessoa?')) return;
		try {
			await remult.repo(Pessoa).delete(pessoa.id);
			await loadData(selectedDate);
		} catch (error) {
			console.error('Error deleting pessoa:', error);
			alert('Erro ao excluir pessoa.');
		}
	}

	// --- Helpers ---
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
		<div class="space-y-4 lg:col-span-2">
			<div class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4">
				<div class="flex items-center justify-between">
					<h3 class="h3">Despesas do Mês</h3>
					<button class="btn preset-filled-primary-200-800" onclick={openAddDespesa}>
						<i class="fa-solid fa-plus mr-2"></i> Adicionar Despesa
					</button>
				</div>

				<div class="table-container overflow-hidden rounded-container">
					<table class="table-hover table">
						<thead class="bg-surface-200-800">
							<tr>
								<th>Descrição</th>
								<th>Data</th>
								<th class="text-right">Valor</th>
								<th class="text-right">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#if loading}
								<tr>
									<td colspan="4" class="p-4 text-center">Carregando...</td>
								</tr>
							{:else}
								{#each despesas as despesa}
									<tr>
										<td>{despesa.descricao}</td>
										<td>{new Date(despesa.data).toLocaleDateString('pt-BR')}</td>
										<td class="text-right font-bold text-error-500">
											- {formatCurrency(despesa.valor)}
										</td>
										<td class="space-x-2 text-right">
											<button
												class="btn-icon btn-icon-sm preset-outlined-primary-200-800"
												title="Editar"
												aria-label="Editar"
												onclick={() => openEditDespesa(despesa)}
											>
												<i class="fa-solid fa-pen"></i>
											</button>
											<button
												class="btn-icon btn-icon-sm preset-outlined-error-200-800"
												title="Excluir"
												aria-label="Excluir"
												onclick={() => deleteDespesa(despesa)}
											>
												<i class="fa-solid fa-trash"></i>
											</button>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="4" class="text-center p-4 text-surface-500">
											Nenhuma despesa encontrada para este mês.
										</td>
									</tr>
								{/each}
							{/if}
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
					<button class="btn preset-filled-primary-200-800" onclick={openAddPessoa}>
						<i class="fa-solid fa-plus mr-2"></i> Adicionar Pessoa
					</button>
				</div>

				<div class="space-y-4">
					{#if loading}
						<div class="p-4 text-center">Carregando...</div>
					{:else}
						{#each pessoasCalculadas as pessoa}
							<div
								class="space-y-4 card border border-surface-200-800 preset-filled-surface-200-800 p-4"
							>
								<div class="flex items-center justify-between border-b border-surface-200-800 pb-2">
									<h4 class="h4 font-bold">{pessoa.nome}</h4>
									<div class="space-x-1">
										<button
											class="btn-icon btn-icon-sm preset-outlined-primary-200-800"
											title="Editar"
											aria-label="Editar"
											onclick={() => openEditPessoa(pessoa)}
										>
											<i class="fa-solid fa-pen"></i>
										</button>
										<button
											class="btn-icon btn-icon-sm preset-outlined-error-200-800"
											title="Excluir"
											aria-label="Excluir"
											onclick={() => deletePessoa(pessoa)}
										>
											<i class="fa-solid fa-trash"></i>
										</button>
									</div>
								</div>

								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-surface-600-400">Salário Líquido:</span>
										<span class="font-bold text-success-500"
											>{formatCurrency(pessoa.salarioLiquido)}</span
										>
									</div>
									<div class="flex justify-between">
										<span class="text-surface-600-400">Valor a pagar:</span>
										<span class="font-bold text-error-500"
											>{formatCurrency(pessoa.valorAPagar)}</span
										>
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
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Despesa Modal -->
	{#if showDespesaModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div class="w-full max-w-md space-y-4 card preset-filled-surface-100-900 p-6">
				<h3 class="h3">{editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}</h3>
				<form
					class="space-y-4"
					onsubmit={(e) => {
						e.preventDefault();
						saveDespesa();
					}}
				>
					<label class="label">
						<span>Descrição</span>
						<input class="input" type="text" bind:value={despesaForm.descricao} required />
					</label>
					<label class="label">
						<span>Valor (R$)</span>
						<input
							class="input"
							type="number"
							step="0.01"
							bind:value={despesaForm.valor}
							required
						/>
					</label>
					<label class="label">
						<span>Data</span>
						<input class="input" type="date" bind:value={despesaForm.data} required />
					</label>
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={despesaForm.paga} />
						<span>Paga</span>
					</label>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							class="btn preset-outlined-surface-500"
							onclick={() => (showDespesaModal = false)}>Cancelar</button
						>
						<button type="submit" class="btn preset-filled-primary-500">Salvar</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Pessoa Modal -->
	{#if showPessoaModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div
				class="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto card preset-filled-surface-100-900 p-6"
			>
				<h3 class="h3">{editingPessoa ? 'Editar Pessoa' : 'Nova Pessoa'}</h3>
				<form
					class="space-y-4"
					onsubmit={(e) => {
						e.preventDefault();
						savePessoa();
					}}
				>
					<label class="label">
						<span>Nome</span>
						<input class="input" type="text" bind:value={pessoaForm.nome} required />
					</label>
					<label class="label">
						<span>Salário Bruto (R$)</span>
						<input
							class="input"
							type="number"
							step="0.01"
							bind:value={pessoaForm.salarioBruto}
							required
						/>
					</label>
					<label class="label">
						<span>Bônus (R$)</span>
						<input class="input" type="number" step="0.01" bind:value={pessoaForm.bonus} />
					</label>
					<label class="label">
						<span>Taxa Alimentação (%)</span>
						<input
							class="input"
							type="number"
							step="0.01"
							max="1"
							bind:value={pessoaForm.porcentagemTaxaAlimentacao}
						/>
						<span class="text-xs text-surface-500">Ex: 0.1 para 10%</span>
					</label>
					<label class="label">
						<span>Taxa Passagem (%)</span>
						<input
							class="input"
							type="number"
							step="0.01"
							max="1"
							bind:value={pessoaForm.porcentagemTaxaPassagem}
						/>
						<span class="text-xs text-surface-500">Ex: 0.06 para 6%</span>
					</label>
					<label class="label">
						<span>Valor Ticket Alimentação (R$)</span>
						<input
							class="input"
							type="number"
							step="0.01"
							bind:value={pessoaForm.valorTicketAlimentacao}
						/>
					</label>
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={pessoaForm.clt} />
						<span>CLT (Calcula INSS automaticamente)</span>
					</label>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							class="btn preset-outlined-surface-500"
							onclick={() => (showPessoaModal = false)}>Cancelar</button
						>
						<button type="submit" class="btn preset-filled-primary-500">Salvar</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
