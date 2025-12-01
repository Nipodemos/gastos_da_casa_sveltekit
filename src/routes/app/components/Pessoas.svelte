<script lang="ts">
	import { remult } from 'remult';
	import { Pessoa } from '../../../shared/pessoa.model';
	import { calculateInssValue } from '$lib/utils/inss';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';

	/**
	 * Props do componente Pessoas.
	 * totalDespesas: O valor total das despesas (input do pai).
	 * averageContribution: A média de contribuição (bindable).
	 */
	let {
		totalDespesas,
		averageContribution = $bindable(0),
		pessoasInfo = $bindable([]),
		receitaTotal = $bindable(0)
	} = $props();

	// --- Estado ---

	/** Lista de pessoas cadastradas */
	let pessoas: Pessoa[] = $state([]);

	/** Indica se os dados estão sendo carregados */
	let loading: boolean = $state(false);

	// --- Estado dos Modais ---

	/** Controla a visibilidade do modal de pessoa */
	let showPessoaModal: boolean = $state(false);

	/** A pessoa sendo editada, ou null se for uma nova pessoa */
	let editingPessoa: Pessoa | null = $state(null);

	/** O formulário da pessoa */
	let pessoaForm: {
		nome: string;
		salarioBruto: number;
		bonus: number;
		porcentagemTaxaAlimentacao: number;
		porcentagemTaxaPassagem: number;
		valorTicketAlimentacao: number;
		clt: boolean;
	} = $state({
		nome: '',
		salarioBruto: 0,
		bonus: 0,
		porcentagemTaxaAlimentacao: 0,
		porcentagemTaxaPassagem: 0,
		valorTicketAlimentacao: 0,
		clt: true
	});

	// --- Estado Derivado (Cálculos) ---

	/** Calcula o total da receita (soma dos salários líquidos) */
	let totalReceita: number = $derived(pessoas.reduce((acc, p) => acc + p.salarioLiquido, 0));

	/**
	 * Calcula os valores individuais para cada pessoa com base no total de despesas.
	 * Inclui a porcentagem de contribuição, valor a pagar e sobra do salário.
	 */
	let pessoasCalculadas: Array<
		Pessoa & { porcentagemContribuicao: number; valorAPagar: number; sobraSalario: number }
	> = $derived(
		pessoas.map((p) => {
			// Proporção da renda total (para calcular quanto pagar)
			const proporcaoReceita = totalReceita > 0 ? p.salarioLiquido / totalReceita : 0;
			const valorAPagar = totalDespesas * proporcaoReceita;
			const sobraSalario = p.salarioLiquido - valorAPagar;
			// Porcentagem de contribuição: quanto do salário vai para despesas
			const porcentagemContribuicao =
				p.salarioLiquido > 0 ? valorAPagar / p.salarioLiquido : 0;

			return {
				...p,
				salarioLiquido: p.salarioLiquido,
				porcentagemContribuicao,
				valorAPagar,
				sobraSalario
			};
		})
	);

	// --- Efeitos ---

	/**
	 * Efeito que carrega os dados ao montar o componente.
	 */
	$effect(() => {
		loadData();
	});

	/**
	 * Efeito que calcula a média de contribuição e atualiza a prop `averageContribution`.
	 */
	$effect(() => {
		averageContribution =
			pessoasCalculadas.length > 0
				? pessoasCalculadas.reduce((acc, p) => acc + p.porcentagemContribuicao, 0) /
					pessoasCalculadas.length
				: 0;
		pessoasInfo = pessoasCalculadas;
		receitaTotal = totalReceita;
	});

	// --- Carregamento de Dados ---

	/**
	 * Carrega a lista de pessoas do banco de dados.
	 */
	async function loadData() {
		loading = true;
		try {
			pessoas = await remult.repo(Pessoa).find({
				orderBy: { nome: 'asc' }
			});
		} catch (error) {
			console.error('Erro ao carregar pessoas:', error);
			alert('Erro ao carregar dados.');
		} finally {
			loading = false;
		}
	}

	// --- Ações ---

	/**
	 * Abre o modal para adicionar uma nova pessoa.
	 */
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

	/**
	 * Abre o modal para editar uma pessoa existente.
	 * @param {Pessoa} pessoa - A pessoa a ser editada.
	 */
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

	/**
	 * Salva a pessoa (nova ou editada) no banco de dados.
	 */
	async function savePessoa() {
		try {
			const repo = remult.repo(Pessoa);
			if (editingPessoa) {
				await repo.update(editingPessoa.id, { ...pessoaForm });
			} else {
				await repo.insert({ ...pessoaForm });
			}
			showPessoaModal = false;
			await loadData();
		} catch (error) {
			console.error('Erro ao salvar pessoa:', error);
			alert('Erro ao salvar pessoa.');
		}
	}

	/**
	 * Exclui uma pessoa após confirmação.
	 * @param {Pessoa} pessoa - A pessoa a ser excluída.
	 */
	async function deletePessoa(pessoa: Pessoa) {
		if (!confirm('Tem certeza que deseja excluir esta pessoa?')) return;
		try {
			await remult.repo(Pessoa).delete(pessoa.id);
			await loadData();
		} catch (error) {
			console.error('Erro ao excluir pessoa:', error);
			alert('Erro ao excluir pessoa.');
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

	/**
	 * Formata um valor numérico para porcentagem.
	 * @param {number} value - O valor a ser formatado.
	 * @returns {string} O valor formatado (ex: 10,00%).
	 */
	function formatPercent(value: number): string {
		return new Intl.NumberFormat('pt-BR', {
			style: 'percent',
			minimumFractionDigits: 2
		}).format(value);
	}
</script>

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
			{:else if pessoasCalculadas.length === 0}
				<div class="p-4 text-center">Nenhuma pessoa cadastrada.</div>
			{:else}
				<Accordion multiple class="space-y-4">
					{#each pessoasCalculadas as pessoa}
						<Accordion.Item value={pessoa.id}>
							<div
								class="space-y-4 card border border-surface-200-800 preset-filled-surface-200-800 p-4 transition-shadow hover:shadow-md"
							>
								<div
									class="flex items-center justify-between border-b border-surface-200-800 pb-2"
								>
									<h4 class="h4 font-bold">{pessoa.nome}</h4>
									<div class="flex gap-2">
										<Accordion.ItemTrigger
											class="group btn-icon btn-icon-sm preset-filled-surface-500"
											title="Ver Detalhes"
											aria-label="Detalhes"
										>
											<i
												class="fa-solid fa-chevron-down transition-transform duration-200 group-data-[state=open]:rotate-180"
											></i>
										</Accordion.ItemTrigger>
										<button
											class="btn-icon btn-icon-sm preset-filled-primary-500"
											title="Editar"
											aria-label="Editar"
											onclick={() => openEditPessoa(pessoa)}
										>
											<i class="fa-solid fa-pen"></i>
										</button>
										<button
											class="btn-icon btn-icon-sm preset-filled-error-500"
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
										<span class="text-surface-800-200">Salário Líquido:</span>
										<span class="font-bold text-success-700-300">
											{formatCurrency(pessoa.salarioLiquido)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-surface-800-200">Valor a pagar:</span>
										<span class="font-bold text-error-700-300">
											{formatCurrency(pessoa.valorAPagar)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-surface-800-200">Sobra do Salário:</span>
										<span class="font-bold text-success-700-300">
											{formatCurrency(pessoa.sobraSalario)}
										</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-surface-800-200"
											>Contribuição (% Renda):</span
										>
										<span class="badge preset-filled-surface-700-300">
											{formatPercent(pessoa.porcentagemContribuicao)}
										</span>
									</div>
								</div>

								<Accordion.ItemContent>
									<div
										class="border-t border-surface-200-800 text-sm text-surface-700-300"
									>
										<h5 class="h5 font-bold">Detalhes do Cálculo</h5>
										<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
											<div class="flex justify-between">
												<span>Salário Bruto:</span>
												<span class="font-medium"
													>{formatCurrency(pessoa.salarioBruto)}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Bônus:</span>
												<span class="font-medium"
													>{formatCurrency(pessoa.bonus)}</span
												>
											</div>
											<div class="flex justify-between">
												<span
													>INSS ({formatPercent(
														pessoa.porcentagemTaxaInss
													)}):</span
												>
												<span class="font-medium text-error-600-400">
													- {formatCurrency(
														calculateInssValue(
															pessoa.salarioBruto,
															pessoa.clt
														)
													)}
												</span>
											</div>
											<div class="flex justify-between">
												<span
													>Alimentação ({formatPercent(
														pessoa.porcentagemTaxaAlimentacao
													)}):</span
												>
												<span class="font-medium text-error-600-400">
													- {formatCurrency(
														pessoa.salarioBruto *
															pessoa.porcentagemTaxaAlimentacao
													)}
												</span>
											</div>
											<div class="flex justify-between">
												<span
													>Passagem ({formatPercent(
														pessoa.porcentagemTaxaPassagem
													)}):</span
												>
												<span class="font-medium text-error-600-400">
													- {formatCurrency(
														pessoa.salarioBruto *
															pessoa.porcentagemTaxaPassagem
													)}
												</span>
											</div>
											<div class="flex justify-between">
												<span>Ticket Alimentação:</span>
												<span class="font-medium"
													>{formatCurrency(
														pessoa.valorTicketAlimentacao
													)}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Regime:</span>
												<span class="font-medium"
													>{pessoa.clt ? 'CLT' : 'Outro'}</span
												>
											</div>
										</div>
									</div>
								</Accordion.ItemContent>
							</div>
						</Accordion.Item>
					{/each}
				</Accordion>
			{/if}
		</div>
	</div>
</div>

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
					<span class="text-xs text-surface-700-300">Ex: 0.1 para 10%</span>
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
					<span class="text-xs text-surface-700-300">Ex: 0.06 para 6%</span>
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
						class="btn preset-outlined-surface-700-300"
						onclick={() => (showPessoaModal = false)}>Cancelar</button
					>
					<button type="submit" class="btn preset-filled-primary-700-300">Salvar</button>
				</div>
			</form>
		</div>
	</div>
{/if}
