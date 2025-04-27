<script lang="ts">
	import {
		Button,
		Modal,
		ModalBody,
		ModalFooter,
		ModalHeader,
		Input,
		FormGroup,
		Label
	} from '@sveltestrap/sveltestrap';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	// Interfaces para os dados do Supabase
	interface Despesa {
		id: number;
		nome: string;
		valor: number;
	}

	interface Pessoa {
		id: number;
		nome: string;
		salario_bruto: number;
		taxa_inss: number;
		taxa_alimentacao: number;
		taxa_transporte: number;
		vale_alimentacao: number;
		salario_liquido: number;
	}
	interface Divisao {
		nome: string;
		valorPagar: string;
		proporcao: string;
	}

	// Estado reativo com $state
	let despesas = $state<Despesa[]>([]);
	let pessoas = $state<Pessoa[]>([]);

	// Estados para controlar os modals e índices de remoção
	let isDespesaModalOpen = $state(false);
	let isPessoaModalOpen = $state(false);
	let removerDespesaId = $state<number | null>(null);
	let removerPessoaId = $state<number | null>(null);
	let isRemoverDespesaModalOpen = $state(false);
	let isRemoverPessoaModalOpen = $state(false);

	// Valores dos formulários (para binding), agora com id
	let despesaForm = $state({ id: null as number | null, nome: '', valor: '' });
	let pessoaForm = $state({
		id: null as number | null,
		nome: '',
		salarioBruto: '',
		taxaInss: '0',
		taxaAlimentacao: '0',
		taxaTransporte: '0',
		valeAlimentacao: '0'
	});

	// Carregar dados do Supabase ao montar o componente
	onMount(async () => {
		await carregarDespesas();
		await carregarPessoas();
	});

	// Função para carregar despesas do Supabase
	async function carregarDespesas() {
		const { data, error } = await supabase.from('despesas').select('*');
		if (error) {
			console.error('Erro ao carregar despesas:', error.message);
			return;
		}
		despesas = data || [];
	}

	// Função para carregar pessoas do Supabase
	async function carregarPessoas() {
		const { data, error } = await supabase.from('pessoas').select('*');
		if (error) {
			console.error('Erro ao carregar pessoas:', error.message);
			return;
		}
		pessoas = data || [];
	}

	// Funções utilitárias
	function calcularSalarioLiquido(
		salarioBruto: number,
		taxaInss: number,
		taxaAlimentacao: number,
		taxaTransporte: number,
		valeAlimentacao: number
	): number {
		const inss = salarioBruto * (taxaInss / 100);
		const alimentacao = salarioBruto * (taxaAlimentacao / 100);
		const transporte = salarioBruto * (taxaTransporte / 100);
		return salarioBruto - inss - alimentacao - transporte + valeAlimentacao;
	}

	// Valores derivados com $derived
	const totalDespesas = $derived(despesas.reduce((sum, d) => sum + d.valor, 0));
	const totalRenda = $derived(pessoas.reduce((sum, p) => sum + p.salario_liquido, 0));
	const divisao = $derived.by<Divisao[]>(() => {
		if (pessoas.length === 0) return [] as Divisao[];
		return pessoas.map<Divisao>((pessoa) => {
			const proporcao = pessoa.salario_liquido / totalRenda;
			const valorPagar = proporcao * totalDespesas;
			return {
				nome: pessoa.nome,
				valorPagar: valorPagar.toFixed(2),
				proporcao: (proporcao * 100).toFixed(2)
			};
		});
	});

	// Funções para abrir os modals
	function abrirAdicionarDespesa() {
		despesaForm = { id: null, nome: '', valor: '' };
		isDespesaModalOpen = true;
	}

	function abrirEditarDespesa(id: number) {
		const despesa = despesas.find((d) => d.id === id);
		if (despesa) {
			despesaForm = { id: despesa.id, nome: despesa.nome, valor: despesa.valor.toString() };
			isDespesaModalOpen = true;
		}
	}

	function abrirAdicionarPessoa() {
		pessoaForm = {
			id: null,
			nome: '',
			salarioBruto: '',
			taxaInss: '0',
			taxaAlimentacao: '0',
			taxaTransporte: '0',
			valeAlimentacao: '0'
		};
		isPessoaModalOpen = true;
	}

	function abrirEditarPessoa(id: number) {
		const pessoa = pessoas.find((p) => p.id === id);
		if (pessoa) {
			pessoaForm = {
				id: pessoa.id,
				nome: pessoa.nome,
				salarioBruto: pessoa.salario_bruto.toString(),
				taxaInss: pessoa.taxa_inss.toString(),
				taxaAlimentacao: pessoa.taxa_alimentacao.toString(),
				taxaTransporte: pessoa.taxa_transporte.toString(),
				valeAlimentacao: pessoa.vale_alimentacao.toString()
			};
			isPessoaModalOpen = true;
		}
	}

	// Funções para salvar os formulários
	async function salvarDespesa(event: Event) {
		event.preventDefault();
		const nome = despesaForm.nome;
		const valor = parseFloat(despesaForm.valor);
		if (nome && valor > 0) {
			if (despesaForm.id === null) {
				// Criação
				const { error } = await supabase.from('despesas').insert({ nome, valor });
				if (error) {
					console.error('Erro ao criar despesa:', error.message);
					return;
				}
			} else {
				// Edição
				const { error } = await supabase
					.from('despesas')
					.update({ nome, valor })
					.eq('id', despesaForm.id);
				if (error) {
					console.error('Erro ao atualizar despesa:', error.message);
					return;
				}
			}
			await carregarDespesas();
			isDespesaModalOpen = false;
		}
	}

	async function salvarPessoa(event: Event) {
		event.preventDefault();
		const nome = pessoaForm.nome;
		const salarioBruto = parseFloat(pessoaForm.salarioBruto);
		const taxaInss = parseFloat(pessoaForm.taxaInss) || 0;
		const taxaAlimentacao = parseFloat(pessoaForm.taxaAlimentacao) || 0;
		const taxaTransporte = parseFloat(pessoaForm.taxaTransporte) || 0;
		const valeAlimentacao = parseFloat(pessoaForm.valeAlimentacao) || 0;
		if (nome && salarioBruto >= 0) {
			if (pessoas.length >= 4 && pessoaForm.id === null) {
				alert('Limite de 4 pessoas atingido.');
				return;
			}
			const salarioLiquido = calcularSalarioLiquido(
				salarioBruto,
				taxaInss,
				taxaAlimentacao,
				taxaTransporte,
				valeAlimentacao
			);
			const novaPessoa = {
				nome,
				salario_bruto: salarioBruto,
				taxa_inss: taxaInss,
				taxa_alimentacao: taxaAlimentacao,
				taxa_transporte: taxaTransporte,
				vale_alimentacao: valeAlimentacao,
				salario_liquido: salarioLiquido
			};
			if (pessoaForm.id === null) {
				// Criação
				const { error } = await supabase.from('pessoas').insert(novaPessoa);
				if (error) {
					console.error('Erro ao criar pessoa:', error.message);
					return;
				}
			} else {
				// Edição
				const { error } = await supabase.from('pessoas').update(novaPessoa).eq('id', pessoaForm.id);
				if (error) {
					console.error('Erro ao atualizar pessoa:', error.message);
					return;
				}
			}
			await carregarPessoas();
			isPessoaModalOpen = false;
		}
	}

	// Funções para remoção
	function abrirRemoverDespesa(id: number) {
		removerDespesaId = id;
		isRemoverDespesaModalOpen = true;
	}

	async function confirmarRemoverDespesa() {
		if (removerDespesaId === null) return; // Garante que removerDespesaId não é null
		const { error } = await supabase.from('despesas').delete().eq('id', removerDespesaId);
		if (error) {
			console.error('Erro ao remover despesa:', error.message);
			return;
		}
		await carregarDespesas();
		isRemoverDespesaModalOpen = false;
		removerDespesaId = null;
	}

	function abrirRemoverPessoa(id: number) {
		removerPessoaId = id;
		isRemoverPessoaModalOpen = true;
	}

	async function confirmarRemoverPessoa() {
		if (removerPessoaId === null) return; // Garante que removerPessoaId não é null
		const { error } = await supabase.from('pessoas').delete().eq('id', removerPessoaId);
		if (error) {
			console.error('Erro ao remover pessoa:', error.message);
			return;
		}
		await carregarPessoas();
		isRemoverPessoaModalOpen = false;
		removerPessoaId = null;
	}

	// Funções para fechar os modals
	function fecharDespesaModal() {
		isDespesaModalOpen = false;
	}

	function fecharPessoaModal() {
		isPessoaModalOpen = false;
	}

	function fecharRemoverDespesaModal() {
		isRemoverDespesaModalOpen = false;
		removerDespesaId = null;
	}

	function fecharRemoverPessoaModal() {
		isRemoverPessoaModalOpen = false;
		removerPessoaId = null;
	}
</script>

<div class="bg-light">
	<!-- Cabeçalho -->
	<header class="bg-primary text-white p-4">
		<div class="container">
			<h1 class="h3 fw-bold">Divisão de Despesas da Casa</h1>
		</div>
	</header>

	<!-- Conteúdo Principal -->
	<main class="container my-4">
		<!-- Seção de Divisão de Despesas (Cards) -->
		<section id="calculos" class="mb-5">
			<h2 class="h4 fw-bold mb-3">Divisão das Despesas</h2>
			<div class="row row-cols-1 row-cols-md-4 g-4">
				{#if pessoas.length === 0}
					<div class="col-12">
						<div class="card h-100" style="min-height: 150px;">
							<div class="card-body text-center d-flex align-items-center justify-content-center">
								<p class="text-muted mb-0">A divisão vai aparecer aqui</p>
							</div>
						</div>
					</div>
				{:else}
					{#each divisao as pessoa}
						<div class="col">
							<div class="card h-100">
								<div class="card-body text-center">
									<h5 class="card-title">{pessoa.nome}</h5>
									<p class="card-text">R$ {pessoa.valorPagar}</p>
									<p class="card-text text-muted">{pessoa.proporcao}%</p>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</section>

		<!-- Tabelas de Despesas e Pessoas (Lado a Lado) -->
		<div class="row">
			<!-- Seção de Despesas -->
			<section id="despesas" class="col-md-6 mb-5">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h2 class="h4 fw-bold mb-0">Despesas Mensais</h2>
					<Button color="primary" onclick={abrirAdicionarDespesa}>Adicionar Despesa</Button>
				</div>
				<div class="table-responsive">
					<table class="table table-striped">
						<thead>
							<tr>
								<th>Despesa</th>
								<th>Valor (R$)</th>
								<th class="text-end">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#if despesas.length === 0}
								<tr>
									<td colspan="3" class="text-center text-muted" style="height: 100px;"
										>Nenhuma despesa cadastrada</td
									>
								</tr>
							{:else}
								{#each despesas as despesa}
									<tr>
										<td>{despesa.nome}</td>
										<td>R$ {despesa.valor.toFixed(2)}</td>
										<td class="text-end">
											<Button
												color="primary"
												size="sm"
												class="me-2"
												onclick={() => abrirEditarDespesa(despesa.id)}>Editar</Button
											>
											<Button
												color="danger"
												size="sm"
												onclick={() => abrirRemoverDespesa(despesa.id)}>Remover</Button
											>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				<p class="fw-bold mt-3">Total: R$ {totalDespesas.toFixed(2)}</p>
			</section>

			<!-- Seção de Pessoas -->
			<section id="membros" class="col-md-6 mb-5">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h2 class="h4 fw-bold mb-0">Membros da Casa</h2>
					<Button color="primary" onclick={abrirAdicionarPessoa}>Adicionar Pessoa</Button>
				</div>
				<div class="table-responsive">
					<table class="table table-striped">
						<thead>
							<tr>
								<th>Nome</th>
								<th>Salário Líquido (R$)</th>
								<th class="text-end">Ações</th>
							</tr>
						</thead>
						<tbody>
							{#if pessoas.length === 0}
								<tr>
									<td colspan="3" class="text-center text-muted" style="height: 100px;"
										>Nenhuma pessoa cadastrada</td
									>
								</tr>
							{:else}
								{#each pessoas as pessoa}
									<tr>
										<td>{pessoa.nome}</td>
										<td>R$ {pessoa.salario_liquido.toFixed(2)}</td>
										<td class="text-end">
											<Button
												color="primary"
												size="sm"
												class="me-2"
												onclick={() => abrirEditarPessoa(pessoa.id)}>Editar</Button
											>
											<Button color="danger" size="sm" onclick={() => abrirRemoverPessoa(pessoa.id)}
												>Remover</Button
											>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				<p class="fw-bold mt-3">Renda Total: R$ {totalRenda.toFixed(2)}</p>
			</section>
		</div>
	</main>

	<!-- Modal para Despesas (Criação e Edição) -->
	<Modal
		isOpen={isDespesaModalOpen}
		toggle={fecharDespesaModal}
		on:open={() => document.querySelector<HTMLInputElement>('#nomeDespesa')?.focus()}
	>
		<ModalHeader toggle={fecharDespesaModal}>
			{despesaForm.id === null ? 'Adicionar Despesa' : 'Editar Despesa'}
		</ModalHeader>
		<ModalBody>
			<form onsubmit={salvarDespesa}>
				<FormGroup>
					<Label for="nomeDespesa">Nome da Despesa</Label>
					<Input
						id="nomeDespesa"
						name="nomeDespesa"
						placeholder="Ex: Aluguel"
						bind:value={despesaForm.nome}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="valorDespesa">Valor (R$)</Label>
					<Input
						type="number"
						id="valorDespesa"
						name="valorDespesa"
						placeholder="Ex: 1000"
						bind:value={despesaForm.valor}
					/>
				</FormGroup>
				<ModalFooter>
					<Button color="secondary" onclick={fecharDespesaModal}>Cancelar</Button>
					<Button color="primary" type="submit">Salvar</Button>
				</ModalFooter>
			</form>
		</ModalBody>
	</Modal>

	<!-- Modal para Pessoas (Criação e Edição) -->
	<Modal
		isOpen={isPessoaModalOpen}
		toggle={fecharPessoaModal}
		on:open={() => document.querySelector<HTMLInputElement>('#nomePessoa')?.focus()}
	>
		<ModalHeader toggle={fecharPessoaModal}>
			{pessoaForm.id === null ? 'Adicionar Pessoa' : 'Editar Pessoa'}
		</ModalHeader>
		<ModalBody>
			<form onsubmit={salvarPessoa}>
				<FormGroup>
					<Label for="nomePessoa">Nome da Pessoa</Label>
					<Input
						id="nomePessoa"
						name="nomePessoa"
						placeholder="Ex: João"
						bind:value={pessoaForm.nome}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="salarioBruto">Salário Bruto (R$)</Label>
					<Input
						type="number"
						id="salarioBruto"
						name="salarioBruto"
						placeholder="Ex: 3000"
						bind:value={pessoaForm.salarioBruto}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="taxaInss">Taxa INSS (%)</Label>
					<Input
						type="number"
						step="0.01"
						id="taxaInss"
						name="taxaInss"
						placeholder="Ex: 7.5"
						bind:value={pessoaForm.taxaInss}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="taxaAlimentacao">Taxa Alimentação (%)</Label>
					<Input
						type="number"
						step="0.01"
						id="taxaAlimentacao"
						name="taxaAlimentacao"
						placeholder="Ex: 2"
						bind:value={pessoaForm.taxaAlimentacao}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="taxaTransporte">Taxa Transporte (%)</Label>
					<Input
						type="number"
						step="0.01"
						id="taxaTransporte"
						name="taxaTransporte"
						placeholder="Ex: 6"
						bind:value={pessoaForm.taxaTransporte}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="valeAlimentacao">Vale Alimentação (R$)</Label>
					<Input
						type="number"
						id="valeAlimentacao"
						name="valeAlimentacao"
						placeholder="Ex: 500"
						bind:value={pessoaForm.valeAlimentacao}
					/>
				</FormGroup>
				<ModalFooter>
					<Button color="secondary" onclick={fecharPessoaModal}>Cancelar</Button>
					<Button color="primary" type="submit">Salvar</Button>
				</ModalFooter>
			</form>
		</ModalBody>
	</Modal>

	<!-- Modal de Confirmação de Remoção de Despesa -->
	<Modal isOpen={isRemoverDespesaModalOpen} toggle={fecharRemoverDespesaModal}>
		<ModalHeader toggle={fecharRemoverDespesaModal}>Confirmar Remoção</ModalHeader>
		<ModalBody>
			<p>Tem certeza que deseja remover esta despesa?</p>
		</ModalBody>
		<ModalFooter>
			<Button color="secondary" onclick={fecharRemoverDespesaModal}>Cancelar</Button>
			<Button color="danger" onclick={confirmarRemoverDespesa}>Remover</Button>
		</ModalFooter>
	</Modal>

	<!-- Modal de Confirmação de Remoção de Pessoa -->
	<Modal isOpen={isRemoverPessoaModalOpen} toggle={fecharRemoverPessoaModal}>
		<ModalHeader toggle={fecharRemoverPessoaModal}>Confirmar Remoção</ModalHeader>
		<ModalBody>
			<p>Tem certeza que deseja remover esta pessoa?</p>
		</ModalBody>
		<ModalFooter>
			<Button color="secondary" onclick={fecharRemoverPessoaModal}>Cancelar</Button>
			<Button color="danger" onclick={confirmarRemoverPessoa}>Remover</Button>
		</ModalFooter>
	</Modal>
</div>
