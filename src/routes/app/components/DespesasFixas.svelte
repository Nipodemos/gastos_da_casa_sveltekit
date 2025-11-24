<script lang="ts">
	import { remult } from 'remult';
	import { DespesaFixa } from '../../../shared/despesa-fixa.model';
	import { Progress } from '@skeletonlabs/skeleton-svelte';

	// --- Estado ---

	/** Lista de despesas fixas */
	let despesasFixas: DespesaFixa[] = $state([]);

	/** Indica se os dados estão sendo carregados */
	let loading: boolean = $state(false);

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

			if (editingDespesaFixa) {
				await repo.update(editingDespesaFixa.id, {
					...form,
					diaVencimento: 1,
					inicio: dateObj
				});
			} else {
				await repo.insert({
					...form,
					diaVencimento: 1,
					inicio: dateObj
				});
			}
			showModal = false;
			await loadData();
		} catch (error) {
			console.error('Erro ao salvar despesa fixa:', error);
			alert('Erro ao salvar despesa fixa.');
		}
	}

	/**
	 * Alterna o status ativo/inativo de uma despesa fixa.
	 * @param {DespesaFixa} despesaFixa - A despesa fixa a ser alternada.
	 */
	async function toggleAtiva(despesaFixa: DespesaFixa) {
		try {
			await remult.repo(DespesaFixa).update(despesaFixa.id, {
				ativa: !despesaFixa.ativa
			});
			await loadData();
		} catch (error) {
			console.error('Erro ao atualizar status:', error);
			alert('Erro ao atualizar status.');
		}
	}

	/**
	 * Exclui uma despesa fixa após confirmação.
	 * @param {DespesaFixa} despesaFixa - A despesa fixa a ser excluída.
	 */
	async function deleteDespesaFixa(despesaFixa: DespesaFixa) {
		if (!confirm('Tem certeza que deseja excluir esta despesa fixa?')) return;
		try {
			await remult.repo(DespesaFixa).delete(despesaFixa.id);
			await loadData();
		} catch (error) {
			console.error('Erro ao excluir despesa fixa:', error);
			alert('Erro ao excluir despesa fixa.');
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
	<div class="space-y-4 card border preset-outlined-surface-200-800 border-surface-200-800 p-4">
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

		<div class="table-container overflow-hidden rounded-container">
			<table class="table-hover table">
				<thead class="bg-surface-200-800">
					<tr>
						<th>Descrição</th>
						<th>Valor</th>
						<th>Início</th>
						<th>Status</th>
						<th>Ações</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary-200-800">
					{#if loading}
						<tr class="h-5 bg-surface-200-800">
							<td colspan="5" class="h-5 p-4 text-center">
								<Progress value={null}>
									<Progress.Track>
										<Progress.Range />
									</Progress.Track>
								</Progress>
							</td>
						</tr>
					{:else}
						{#each despesasFixas as despesaFixa}
							<tr class="bg-surface-200-800">
								<td>{despesaFixa.descricao}</td>
								<td class="font-bold text-error-500">
									{formatCurrency(despesaFixa.valor)}
								</td>
								<td>{new Date(despesaFixa.inicio).toLocaleDateString('pt-BR')}</td>
								<td>
									{#if despesaFixa.ativa}
										<span class="badge preset-filled-success-500">Ativa</span>
									{:else}
										<span class="badge preset-filled-surface-500">Inativa</span>
									{/if}
								</td>
								<td class="space-x-2">
									<button
										class="btn-icon btn-icon-sm {despesaFixa.ativa
											? 'preset-filled-warning-200-800'
											: 'preset-filled-success-200-800'}"
										title={despesaFixa.ativa ? 'Desativar' : 'Ativar'}
										aria-label={despesaFixa.ativa ? 'Desativar' : 'Ativar'}
										onclick={() => toggleAtiva(despesaFixa)}
									>
										<i
											class="fa-solid fa-{despesaFixa.ativa
												? 'pause'
												: 'play'}"
										></i>
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
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center p-4 text-surface-500">
									Nenhuma despesa fixa cadastrada.
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
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
