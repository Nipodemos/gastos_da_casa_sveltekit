<script lang="ts">
	import { remult } from 'remult';
	import { DespesaFixa } from '../../../shared/despesa-fixa.model';
	import { createToaster, Progress } from '@skeletonlabs/skeleton-svelte';

	import { getContext } from 'svelte';

	// --- Estado ---

	/** Gerenciador de Toasts do Skeleton */
	const toaster = getContext<ReturnType<typeof createToaster>>('toaster');

	/** Lista de despesas fixas */
	let despesasFixas: DespesaFixa[] = $state([]);

	/** Indica se os dados estão sendo carregados */
	let loading: boolean = $state(false);

	/** ID da despesa fixa que está sendo alterada (para loading no botão) */
	let togglingId: string | null = $state(null);

	// --- Estado dos Modais ---

	/** Controla a visibilidade do modal de despesa fixa */
	let showModal: boolean = $state(false);

	/** A despesa fixa sendo editada, ou null se for uma nova */
	let editingDespesaFixa: DespesaFixa | null = $state(null);

	/** O formulário da despesa fixa */
	let form: {
		descricao: string;
		valor: number;
		diaVencimento: number;
		inicio: string;
		ativa: boolean;
	} = $state({
		descricao: '',
		valor: 0,
		diaVencimento: 1,
		inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
			.toISOString()
			.slice(0, 7),
		ativa: true
	});

	// --- Efeitos ---

	/**
	 * Efeito que carrega as despesas fixas quando o componente é montado.
	 */
	$effect(() => {
		loadData();
	});

	// --- Carregamento de Dados ---

	/**
	 * Carrega todas as despesas fixas.
	 */
	async function loadData() {
		loading = true;
		try {
			despesasFixas = await remult.repo(DespesaFixa).find({
				orderBy: { diaVencimento: 'asc' }
			});
		} catch (error) {
			console.error('Erro ao carregar despesas fixas:', error);
			alert('Erro ao carregar dados.');
		} finally {
			loading = false;
		}
	}

	// --- Ações ---

	/**
	 * Abre o modal para adicionar uma nova despesa fixa.
	 */
	function openAdd() {
		editingDespesaFixa = null;
		const today = new Date();
		form = {
			descricao: '',
			valor: 0,
			diaVencimento: 1,
			inicio: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 7),
			ativa: true
		};
		showModal = true;
	}

	/**
	 * Abre o modal para editar uma despesa fixa existente.
	 * @param {DespesaFixa} despesaFixa - A despesa fixa a ser editada.
	 */
	function openEdit(despesaFixa: DespesaFixa) {
		editingDespesaFixa = despesaFixa;
		form = {
			descricao: despesaFixa.descricao,
			valor: despesaFixa.valor,
			diaVencimento: 1,
			inicio: new Date(despesaFixa.inicio).toISOString().slice(0, 7),
			ativa: despesaFixa.ativa
		};
		showModal = true;
	}

	/**
	 * Salva a despesa fixa (nova ou editada) no banco de dados.
	 */
	async function save() {
		try {
			const repo = remult.repo(DespesaFixa);
			// Cria o objeto Date corrigindo a questão do fuso horário
			const [y, m] = form.inicio.split('-').map(Number);
			// Força o dia 1 conforme solicitado
			const dateObj = new Date(y, m - 1, 1);

			const promise = (async () => {
				if (editingDespesaFixa) {
					const updated = await repo.update(editingDespesaFixa.id, {
						...form,
						diaVencimento: 1,
						inicio: dateObj
					});
					const index = despesasFixas.findIndex((d) => d.id === editingDespesaFixa!.id);
					if (index !== -1) {
						despesasFixas[index] = updated;
					}
				} else {
					const newDespesa = await repo.insert({
						...form,
						diaVencimento: 1,
						inicio: dateObj
					});
					despesasFixas = [...despesasFixas, newDespesa];
				}

				// Ordena por dia de vencimento (mesmo sendo 1, mantém consistência)
				despesasFixas.sort((a, b) => a.diaVencimento - b.diaVencimento);

				showModal = false;
			})();

			toaster.promise(promise, {
				loading: {
					description: 'Salvando despesa fixa...',
					meta: { icon: 'fa-solid fa-spinner fa-spin' }
				},
				success: {
					description: 'Despesa fixa salva com sucesso!',
					meta: { icon: 'fa-solid fa-check' }
				},
				error: {
					description: 'Erro ao salvar despesa fixa.',
					meta: { icon: 'fa-solid fa-exclamation' }
				}
			});

			await promise;
		} catch (error) {
			console.error('Erro ao salvar despesa fixa:', error);
		}
	}

	/**
	 * Alterna o status ativo/inativo de uma despesa fixa.
	 * @param {DespesaFixa} despesaFixa - A despesa fixa a ser alternada.
	 */
	async function toggleAtiva(despesaFixa: DespesaFixa) {
		if (togglingId === despesaFixa.id) return; // Evita duplo clique
		togglingId = despesaFixa.id;

		try {
			await remult.repo(DespesaFixa).update(despesaFixa.id, {
				ativa: !despesaFixa.ativa
			});
			despesaFixa.ativa = !despesaFixa.ativa;
		} catch (error) {
			console.error('Erro ao atualizar status:', error);
			toaster.create({ description: 'Erro ao atualizar status.', type: 'error' });
		} finally {
			togglingId = null;
		}
	}

	/**
	 * Exclui uma despesa fixa após confirmação.
	 * @param {DespesaFixa} despesaFixa - A despesa fixa a ser excluída.
	 */
	async function deleteDespesaFixa(despesaFixa: DespesaFixa) {
		if (!confirm('Tem certeza que deseja excluir esta despesa fixa?')) return;

		try {
			const promise = (async () => {
				await remult.repo(DespesaFixa).delete(despesaFixa.id);
				despesasFixas = despesasFixas.filter((d) => d.id !== despesaFixa.id);
			})();

			toaster.promise(promise, {
				loading: {
					description: 'Excluindo despesa fixa...',
					meta: { icon: 'fa-solid fa-spinner fa-spin' }
				},
				success: {
					description: 'Despesa fixa excluída com sucesso!',
					meta: { icon: 'fa-solid fa-check' }
				},
				error: {
					description: 'Erro ao excluir despesa fixa.',
					meta: { icon: 'fa-solid fa-exclamation' }
				}
			});

			await promise;
		} catch (error) {
			console.error('Erro ao excluir despesa fixa:', error);
		}
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

<div class="space-y-4">
	<div
		class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4 shadow-sm"
	>
		<div class="flex items-center justify-between">
			<div>
				<h3 class="h3">Despesas Fixas</h3>
				<p class="text-sm text-surface-600-400">
					Despesas que se repetem mensalmente de forma automática
				</p>
			</div>
			<button class="btn preset-filled-primary-200-800" onclick={openAdd}>
				<i class="fa-solid fa-plus mr-2"></i> Adicionar Despesa Fixa
			</button>
		</div>

		<div class="overflow-hidden rounded-container border border-surface-200-800">
			<div
				class="hidden grid-cols-[minmax(0,1fr)_130px_120px_128px_132px] items-center gap-3 bg-surface-300-700 px-4 py-3 text-sm font-semibold md:grid"
			>
				<div>Descrição</div>
				<div class="text-right">Valor</div>
				<div>Início</div>
				<div class="text-center">Status</div>
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
			{:else if despesasFixas.length === 0}
				<div class="p-4 text-center text-surface-500">
					Nenhuma despesa fixa cadastrada.
				</div>
			{:else}
				<div class="space-y-2 p-2 md:space-y-0 md:p-0">
					{#each despesasFixas as despesaFixa}
						<div
							class="odd:bg-surface-100-900 even:bg-surface-200-800 rounded-container border border-surface-200-800 p-3 md:grid md:grid-cols-[minmax(0,1fr)_130px_120px_128px_132px] md:items-center md:gap-3 md:rounded-none md:border-0 md:px-4 md:py-3 md:[&:hover]:preset-tonal-primary-200-800"
						>
							<div class="flex items-center justify-between gap-3 md:block">
								<span class="text-xs font-medium uppercase tracking-wide text-surface-500 md:hidden"
									>Descrição</span
								>
								<div class="min-w-0 flex-1 text-right md:text-left">
									<span class="truncate">{despesaFixa.descricao}</span>
								</div>
							</div>

							<div
								class="mt-2 flex items-center justify-between gap-3 font-bold text-error-500 md:mt-0 md:block md:text-right"
							>
								<span class="text-xs font-medium uppercase tracking-wide text-surface-500 md:hidden"
									>Valor</span
								>
								<span>{formatCurrency(despesaFixa.valor)}</span>
							</div>

							<div class="mt-2 flex items-center justify-between gap-3 md:mt-0 md:block">
								<span class="text-xs font-medium uppercase tracking-wide text-surface-500 md:hidden"
									>Início</span
								>
								<span>{new Date(despesaFixa.inicio).toLocaleDateString('pt-BR')}</span>
							</div>

							<div
								class="mt-2 flex items-center justify-between gap-3 md:mt-0 md:flex md:h-full md:items-center md:justify-center"
							>
								<span class="text-xs font-medium uppercase tracking-wide text-surface-500 md:hidden"
									>Status</span
								>
								{#if despesaFixa.ativa}
									<span
										class="badge preset-filled-success-500 md:inline-flex md:min-w-[92px] md:items-center md:justify-center md:text-center"
										>Ativa</span
									>
								{:else}
									<span
										class="badge preset-filled-surface-500 md:inline-flex md:min-w-[92px] md:items-center md:justify-center md:text-center"
										>Inativa</span
									>
								{/if}
							</div>

							<div class="mt-3 flex items-center justify-end gap-2 md:mt-0 md:justify-start">
								<button
									class="btn-icon btn-icon-sm {despesaFixa.ativa
										? 'preset-filled-warning-200-800'
										: 'preset-filled-success-200-800'}"
									title={despesaFixa.ativa ? 'Desativar' : 'Ativar'}
									aria-label={despesaFixa.ativa ? 'Desativar' : 'Ativar'}
									onclick={() => toggleAtiva(despesaFixa)}
									disabled={togglingId === despesaFixa.id}
								>
									{#if togglingId === despesaFixa.id}
										<i class="fa-solid fa-spinner fa-spin"></i>
									{:else}
										<i
											class="fa-solid fa-{despesaFixa.ativa
												? 'pause'
												: 'play'}"
										></i>
									{/if}
								</button>
								<button
									class="btn-icon btn-icon-sm preset-filled-primary-200-800"
									title="Editar"
									aria-label="Editar"
									onclick={() => openEdit(despesaFixa)}
								>
									<i class="fa-solid fa-pen"></i>
								</button>
								<button
									class="btn-icon btn-icon-sm preset-filled-error-200-800"
									title="Excluir"
									aria-label="Excluir"
									onclick={() => deleteDespesaFixa(despesaFixa)}
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

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md space-y-4 card preset-filled-surface-100-900 p-6">
			<h3 class="h3">{editingDespesaFixa ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}</h3>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					save();
				}}
			>
				<label class="label">
					<span>Descrição</span>
					<input class="input" type="text" bind:value={form.descricao} required />
				</label>
				<label class="label">
					<span>Valor (R$)</span>
					<input
						class="input"
						type="number"
						step="0.01"
						bind:value={form.valor}
						required
					/>
				</label>
				<label class="label">
					<span>Data de Início</span>
					<input class="input" type="month" bind:value={form.inicio} required />
				</label>
				<label class="flex items-center space-x-2">
					<input class="checkbox" type="checkbox" bind:checked={form.ativa} />
					<span>Ativa</span>
				</label>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="btn preset-outlined-surface-500"
						onclick={() => (showModal = false)}>Cancelar</button
					>
					<button type="submit" class="btn preset-filled-primary-500">Salvar</button>
				</div>
			</form>
		</div>
	</div>
{/if}
