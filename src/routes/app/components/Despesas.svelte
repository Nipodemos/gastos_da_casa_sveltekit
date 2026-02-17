<script lang="ts">
	import { remult } from 'remult';
	import { Despesa } from '../../../shared/despesa.model';
	import { Progress, createToaster } from '@skeletonlabs/skeleton-svelte';
	import { DespesasController } from '../../../server/despesas.controller';
	import { getContext } from 'svelte';

	import { goto } from '$app/navigation';
	let { mesAnoSelecionado, totalDespesas = $bindable(0) } = $props();

	// --- Estado ---

	/** Lista de despesas do mês selecionado */
	let despesas: Despesa[] = $state([]);

	/** Indica se os dados estão sendo carregados */
	let loading: boolean = $state(false);

	/** ID da despesa que está sendo alterada (para loading no botão) */
	let togglingId: string | null = $state(null);

	/** Gerenciador de Toasts do Skeleton */
	const toaster = getContext<ReturnType<typeof createToaster>>('toaster');

	// --- Estado dos Modais ---

	/** Controla a visibilidade do modal de despesa */
	let showDespesaModal: boolean = $state(false);

	/** A despesa sendo editada, ou null se for uma nova despesa */
	let editingDespesa: Despesa | null = $state(null);

	/** O formulário da despesa */
	let despesaForm: {
		descricao: string;
		valor: number;
		data: string;
		paga: boolean;
	} = $state({
		descricao: '',
		valor: 0,
		data: new Date().toISOString().slice(0, 10),
		paga: false
	});

	// --- Efeitos ---

	/**
	 * Efeito que recarrega os dados sempre que a data selecionada muda.
	 */
	$effect(() => {
		loadData(mesAnoSelecionado);
	});

	/**
	 * Efeito que recalcula o total de despesas sempre que a lista de despesas muda.
	 * Atualiza a prop `totalDespesas` para que o componente pai tenha acesso ao valor.
	 */
	$effect(() => {
		totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
	});

	// --- Carregamento de Dados ---

	/**
	 * Carrega as despesas para o mês e ano especificados.
	 * Também garante que as despesas fixas sejam geradas para o mês.
	 * @param {string} dateStr - A data no formato 'YYYY-MM'.
	 */
	async function loadData(dateStr: string) {
		loading = true;
		try {
			const [year, month] = dateStr.split('-').map(Number);

			// Garante que as despesas fixas sejam geradas para este mês
			await DespesasController.garantirDespesasFixas(month, year);

			// Cria datas em UTC para garantir que cobrimos o mês inteiro independentemente do fuso horário
			const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
			const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

			// Busca as despesas no banco de dados
			despesas = await remult.repo(Despesa).find({
				where: {
					data: { $gte: startOfMonth, $lte: endOfMonth },
					excluida: false
				},
				orderBy: { descricao: 'asc' }
			});
		} catch (error) {
			console.error('Erro ao carregar despesas:', error);
			toaster.create({ description: 'Erro ao carregar dados.', type: 'error' });
		} finally {
			loading = false;
		}
	}

	// --- Ações ---

	/**
	 * Navega para o mês anterior ou seguinte.
	 * @param {number} offset -> -1 para mês anterior, 1 para mês seguinte.
	 */
	function changeMonth(offset: number) {
		const [year, month] = mesAnoSelecionado.split('-').map(Number);
		const d = new Date(year, month - 1 + offset, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		goto(`?date=${y}-${m}`, { noScroll: true });
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
	 * Abre o modal para adicionar uma nova despesa.
	 * Define a data padrão para o primeiro dia do mês selecionado (ou hoje se for o mês atual).
	 */
	function openAddDespesa() {
		editingDespesa = null;

		despesaForm = {
			descricao: '',
			valor: 0,
			data: mesAnoSelecionado,
			paga: false
		};

		showDespesaModal = true;
	}

	/**
	 * Abre o modal para editar uma despesa existente.
	 * @param {Despesa} despesa - A despesa a ser editada.
	 */
	function openEditDespesa(despesa: Despesa) {
		editingDespesa = despesa;
		despesaForm = {
			descricao: despesa.descricao,
			valor: despesa.valor,
			data: new Date(despesa.data).toISOString().slice(0, 7),
			paga: despesa.paga
		};
		showDespesaModal = true;
	}

	/**
	 * Salva a despesa (nova ou editada) no banco de dados.
	 */
	async function saveDespesa() {
		try {
			const repo = remult.repo(Despesa);
			// Cria o objeto Date corrigindo a questão do fuso horário (simplificado)
			const [y, m] = despesaForm.data.split('-').map(Number);
			const dateObj = new Date(y, m - 1);

			//capitalizar primeira letra da descrição antes de salvar
			despesaForm.descricao =
				despesaForm.descricao.charAt(0).toUpperCase() + despesaForm.descricao.slice(1);

			const promise = (async () => {
				if (editingDespesa) {
					await repo.update(editingDespesa.id, {
						...despesaForm,
						data: dateObj
					});

					// Verifica se a despesa ainda pertence ao mês selecionado
					if (despesaForm.data.startsWith(mesAnoSelecionado)) {
						// Atualiza no array local
						const index = despesas.findIndex((d) => d.id === editingDespesa!.id);
						if (index !== -1) {
							// Forçamos o type casting ou ordem correta para garantir que 'data' seja Date
							despesas[index] = { ...despesas[index], ...despesaForm, data: dateObj };
						}
					} else {
						// Se mudou de mês, remove do array local
						despesas = despesas.filter((d) => d.id !== editingDespesa!.id);
					}
				} else {
					const newDespesa = await repo.insert({
						...despesaForm,
						data: dateObj,
						excluida: false
					});

					// Verifica se a nova despesa pertence ao mês selecionado
					if (despesaForm.data.startsWith(mesAnoSelecionado)) {
						despesas = [...despesas, newDespesa];
					}
				}

				// Ordena as despesas por descricao
				despesas.sort((a, b) =>
					a.descricao.localeCompare(b.descricao, 'en', {
						sensitivity: 'variant',
						caseFirst: 'upper',
						numeric: false
					})
				);

				showDespesaModal = false;
			})();

			toaster.promise(promise, {
				loading: {
					description: 'Salvando despesa...',
					meta: {
						icon: 'fa-solid fa-spinner fa-spin'
					}
				},
				success: {
					description: 'Despesa salva com sucesso!',
					meta: { icon: 'fa-solid fa-check' }
				},
				error: {
					description: 'Erro ao salvar despesa.',
					meta: { icon: 'fa-solid fa-exclamation' }
				}
			});

			await promise;
		} catch (error) {
			console.error('Erro ao salvar despesa:', error);
		}
	}

	/**
	 * Alterna o status de pagamento da despesa.
	 * @param despesa A despesa a ser alterada.
	 */
	async function togglePaga(despesa: Despesa) {
		if (togglingId === despesa.id) return; // Evita duplo clique
		togglingId = despesa.id;

		const novoStatus = !despesa.paga;

		try {
			await remult.repo(Despesa).update(despesa.id, { paga: novoStatus });
			// Atualiza localmente
			despesa.paga = novoStatus;
		} catch (error) {
			console.error('Erro ao alterar status da despesa:', error);
			toaster.create({ description: 'Erro ao alterar status.', type: 'error' });
		} finally {
			togglingId = null;
		}
	}

	/**
	 * Exclui uma despesa após confirmação.
	 * @param {Despesa} despesa - A despesa a ser excluída.
	 */
	async function deleteDespesa(despesa: Despesa) {
		if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

		const promise = (async () => {
			await remult.repo(Despesa).delete(despesa.id);
			await loadData(mesAnoSelecionado);
		})();

		toaster.promise(promise, {
			loading: { description: 'Excluindo despesa...' },
			success: { description: 'Despesa excluída com sucesso!' },
			error: { description: 'Erro ao excluir despesa.' }
		});
	}

	/**
	 * Formata um valor numérico para moeda BRL.
	 * @param {number} value - O valor a ser formatado.
	 * @returns {string} O valor formatado (ex: R$ 1.234,56).
	 */
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
	}
</script>

<div class="space-y-4 lg:col-span-2">
	<div
		class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4 shadow-sm"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2">
				<button
					class="btn-icon btn-icon-sm preset-filled-surface-200-800"
					onclick={() => changeMonth(-1)}
					aria-label="Mês anterior"
				>
					<i class="fa-solid fa-chevron-left"></i>
				</button>
				<h3 class="min-w-[180px] text-center h3 capitalize">
					{formatMonthYear(mesAnoSelecionado)}
				</h3>
				<button
					class="btn-icon btn-icon-sm preset-filled-surface-200-800"
					onclick={() => changeMonth(1)}
					aria-label="Mês seguinte"
				>
					<i class="fa-solid fa-chevron-right"></i>
				</button>
			</div>
			<button class="btn preset-filled-primary-200-800" onclick={openAddDespesa}>
				<i class="fa-solid fa-plus mr-2"></i> Adicionar Despesa
			</button>
		</div>

		<div class="overflow-hidden rounded-container border border-surface-200-800">
			<div
				class="hidden grid-cols-[minmax(0,1fr)_128px_140px_132px] items-center gap-3 bg-surface-300-700 px-4 py-3 text-sm font-semibold md:grid"
			>
				<div>Descrição</div>
				<div class="text-center">Status</div>
				<div class="text-right">Valor</div>
				<div class="text-left">Ações</div>
			</div>

			{#if loading}
				<div class="h-5 bg-surface-200-800 p-4 text-center">
					<Progress value={null}>
						<Progress.Track>
							<Progress.Range />
						</Progress.Track>
					</Progress>
				</div>
			{:else if despesas.length === 0}
				<div class="p-4 text-center text-surface-500">
					Nenhuma despesa encontrada para este mês.
				</div>
			{:else}
				<div class="space-y-2 p-2 md:space-y-0 md:p-0">
					{#each despesas as despesa}
						<div
							class="md:[&:hover]:preset-tonal-primary-200-800 rounded-container border border-surface-200-800 p-3 odd:bg-surface-100-900 even:bg-surface-200-800 md:grid md:grid-cols-[minmax(0,1fr)_128px_140px_132px] md:items-center md:gap-3 md:rounded-none md:border-0 md:px-4 md:py-3"
						>
							<div class="flex items-center justify-between gap-3 md:block">
								<span
									class="text-xs font-medium tracking-wide text-surface-500 uppercase md:hidden"
									>Descrição</span
								>
								<div class="min-w-0 flex-1 text-right md:text-left">
									<span class="truncate">{despesa.descricao}</span>
									{#if despesa.fixa}
										<i
											class="fa-solid fa-thumbtack ml-2 text-surface-400"
											title="Despesa Fixa"
										></i>
									{/if}
								</div>
							</div>

							<div
								class="mt-2 flex items-center justify-between gap-3 md:mt-0 md:flex md:h-full md:min-w-[120px] md:items-center md:justify-center"
							>
								<span
									class="text-xs font-medium tracking-wide text-surface-500 uppercase md:hidden"
								>
									Status
								</span>
								{#if despesa.paga}
									<span
										class="badge preset-filled-success-500 md:inline-flex md:items-center md:justify-center md:text-center"
									>
										Pago
									</span>
								{:else}
									<span
										class="badge preset-filled-surface-500 md:inline-flex md:items-center md:justify-center md:text-center"
									>
										Pendente
									</span>
								{/if}
							</div>

							<div
								class="mt-2 flex items-center justify-between gap-3 font-bold text-error-500 md:mt-0 md:block md:text-right"
							>
								<span
									class="text-xs font-medium tracking-wide text-surface-500 uppercase md:hidden"
									>Valor</span
								>
								<span>- {formatCurrency(despesa.valor)}</span>
							</div>

							<div
								class="mt-3 flex items-center justify-end gap-2 md:mt-0 md:justify-start"
							>
								<button
									class="btn-icon btn-icon-sm {despesa.paga
										? 'preset-filled-surface-300-700'
										: 'preset-filled-success-300-700'}"
									title={despesa.paga
										? 'Marcar como pendente'
										: 'Marcar como pago'}
									onclick={() => togglePaga(despesa)}
									disabled={togglingId === despesa.id}
								>
									{#if togglingId === despesa.id}
										<i class="fa-solid fa-spinner fa-spin"></i>
									{:else if despesa.paga}
										<i class="fa-solid fa-xmark"></i>
									{:else}
										<i class="fa-solid fa-check"></i>
									{/if}
								</button>

								<button
									class="btn-icon btn-icon-sm preset-filled-primary-300-700"
									title="Editar"
									aria-label="Editar"
									onclick={() => openEditDespesa(despesa)}
								>
									<i class="fa-solid fa-pen"></i>
								</button>
								<button
									class="btn-icon btn-icon-sm preset-filled-error-300-700"
									title="Excluir"
									aria-label="Excluir"
									onclick={() => deleteDespesa(despesa)}
								>
									<i class="fa-solid fa-trash"></i>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
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
					<input class="input" type="month" bind:value={despesaForm.data} required />
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
