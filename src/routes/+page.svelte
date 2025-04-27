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
	type Despesa = {
		nome: string;
		valor: number;
	};
	type Membro = {
		nome: string;
		salarioBruto: number;
		taxaInss: number;
		taxaAlimentacao: number;
		taxaTransporte: number;
		valeAlimentacao: number;
		salarioLiquido?: number; // Opcional, pois é calculado
	};
	type Divisao = {
		nome: string;
		valorPagar: string;
		proporcao: string;
	};

	// Estado reativo com $state
	let despesas: Despesa[] = $state([] as Despesa[]);
	let membros: Membro[] = $state([] as Membro[]);

	// Estados para controlar os modals e índices de edição
	let isDespesaModalOpen = $state(false);
	let isMembroModalOpen = $state(false);
	let editDespesaId = $state(0);
	let editMembroId = $state(0);
	let removerDespesaId = $state(0);
	let removerMembroId = $state(0);
	let isRemoverDespesaModalOpen = $state(false);
	let isRemoverMembroModalOpen = $state(false);

	// Valores dos formulários (para binding)
	let despesaForm = $state({ nome: '', valor: '' });
	let membroForm = $state({
		nome: '',
		salarioBruto: '',
		taxaInss: '0',
		taxaAlimentacao: '0',
		taxaTransporte: '0',
		valeAlimentacao: '0'
	});

	// Funções utilitárias
	function calcularSalarioLiquido(
		salarioBruto: number,
		taxaInss: number,
		taxaAlimentacao: number,
		taxaTransporte: number,
		valeAlimentacao: number
	) {
		const inss = salarioBruto * (taxaInss / 100);
		const alimentacao = salarioBruto * (taxaAlimentacao / 100);
		const transporte = salarioBruto * (taxaTransporte / 100);
		return salarioBruto - inss - alimentacao - transporte + valeAlimentacao;
	}

	// Valores derivados com $derived
	const totalDespesas = $derived(despesas.reduce((sum, d) => sum + d.valor, 0));
	const totalRenda = $derived(membros.reduce((sum, m) => sum + (m.salarioLiquido ?? 0), 0));
	const divisao = $derived.by(() => {
		if (membros.length === 0) return [] as Divisao[];
		return membros.map<Divisao>((membro) => {
			const proporcao = (membro.salarioLiquido ?? 0) / totalRenda;
			const valorPagar = proporcao * totalDespesas;
			return {
				nome: membro.nome,
				valorPagar: valorPagar.toFixed(2),
				proporcao: (proporcao * 100).toFixed(2)
			};
		});
	});

	// Funções para abrir os modals
	function abrirAdicionarDespesa() {
		editDespesaId = 0;
		despesaForm = { nome: '', valor: '' };
		isDespesaModalOpen = true;
	}

	function abrirEditarDespesa(index: number) {
		editDespesaId = index;
		despesaForm = { nome: despesas[index].nome, valor: despesas[index].valor.toString() };
		isDespesaModalOpen = true;
	}

	function abrirAdicionarMembro() {
		editMembroId = 0;
		membroForm = {
			nome: '',
			salarioBruto: '',
			taxaInss: '0',
			taxaAlimentacao: '0',
			taxaTransporte: '0',
			valeAlimentacao: '0'
		};
		isMembroModalOpen = true;
	}

	function abrirEditarMembro(index: number) {
		editMembroId = index;
		membroForm = {
			nome: membros[index].nome,
			salarioBruto: membros[index].salarioBruto.toString(),
			taxaInss: membros[index].taxaInss.toString(),
			taxaAlimentacao: membros[index].taxaAlimentacao.toString(),
			taxaTransporte: membros[index].taxaTransporte.toString(),
			valeAlimentacao: membros[index].valeAlimentacao.toString()
		};
		isMembroModalOpen = true;
	}

	// Funções para salvar os formulários
	function salvarDespesa(event: { preventDefault: () => void }) {
		event.preventDefault();
		const nome = despesaForm.nome;
		const valor = parseFloat(despesaForm.valor);
		if (nome && valor > 0) {
			if (editDespesaId === 0) {
				// Criação
				despesas.push({ nome, valor });
			} else {
				// Edição
				despesas[editDespesaId] = { nome, valor };
			}
			isDespesaModalOpen = false;
		}
	}

	function salvarMembro(event: { preventDefault: () => void }) {
		event.preventDefault();
		const nome = membroForm.nome;
		const salarioBruto = parseFloat(membroForm.salarioBruto);
		const taxaInss = parseFloat(membroForm.taxaInss) || 0;
		const taxaAlimentacao = parseFloat(membroForm.taxaAlimentacao) || 0;
		const taxaTransporte = parseFloat(membroForm.taxaTransporte) || 0;
		const valeAlimentacao = parseFloat(membroForm.valeAlimentacao) || 0;
		if (nome && salarioBruto >= 0) {
			if (membros.length >= 4 && editMembroId === null) {
				alert('Limite de 4 membros atingido.');
				return;
			}
			const salarioLiquido = calcularSalarioLiquido(
				salarioBruto,
				taxaInss,
				taxaAlimentacao,
				taxaTransporte,
				valeAlimentacao
			);
			const novoMembro = {
				nome,
				salarioBruto,
				taxaInss,
				taxaAlimentacao,
				taxaTransporte,
				valeAlimentacao,
				salarioLiquido
			};
			if (editMembroId === 0) {
				// Criação
				membros.push(novoMembro);
			} else {
				// Edição
				membros[editMembroId] = novoMembro;
			}
			isMembroModalOpen = false;
		}
	}

	// Funções para remoção
	function abrirRemoverDespesa(index: number) {
		removerDespesaId = index;
		isRemoverDespesaModalOpen = true;
	}

	function confirmarRemoverDespesa() {
		despesas.splice(removerDespesaId, 1);
		isRemoverDespesaModalOpen = false;
	}

	function abrirRemoverMembro(index: number) {
		removerMembroId = index;
		isRemoverMembroModalOpen = true;
	}

	function confirmarRemoverMembro() {
		membros.splice(removerMembroId, 1);
		isRemoverMembroModalOpen = false;
	}

	// Função para fechar os modals
	function fecharDespesaModal() {
		isDespesaModalOpen = false;
	}

	function fecharMembroModal() {
		isMembroModalOpen = false;
	}

	function fecharRemoverDespesaModal() {
		isRemoverDespesaModalOpen = false;
	}

	function fecharRemoverMembroModal() {
		isRemoverMembroModalOpen = false;
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
				{#if membros.length === 0}
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

		<!-- Tabelas de Despesas e Membros (Lado a Lado) -->
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
								{#each despesas as despesa, index}
									<tr>
										<td>{despesa.nome}</td>
										<td>R$ {despesa.valor.toFixed(2)}</td>
										<td class="text-end">
											<Button
												color="primary"
												size="sm"
												class="me-2"
												onclick={() => abrirEditarDespesa(index)}>Editar</Button
											>
											<Button color="danger" size="sm" onclick={() => abrirRemoverDespesa(index)}
												>Remover</Button
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

			<!-- Seção de Membros -->
			<section id="membros" class="col-md-6 mb-5">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h2 class="h4 fw-bold mb-0">Membros da Casa</h2>
					<Button color="primary" onclick={abrirAdicionarMembro}>Adicionar Membro</Button>
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
							{#if membros.length === 0}
								<tr>
									<td colspan="3" class="text-center text-muted" style="height: 100px;"
										>Nenhum membro cadastrado</td
									>
								</tr>
							{:else}
								{#each membros as membro, index}
									<tr>
										<td>{membro.nome}</td>
										<td>R$ {membro?.salarioLiquido?.toFixed(2)}</td>
										<td class="text-end">
											<Button
												color="primary"
												size="sm"
												class="me-2"
												onclick={() => abrirEditarMembro(index)}>Editar</Button
											>
											<Button color="danger" size="sm" onclick={() => abrirRemoverMembro(index)}
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
			{editDespesaId === null ? 'Adicionar Despesa' : 'Editar Despesa'}
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

	<!-- Modal para Membros (Criação e Edição) -->
	<Modal
		isOpen={isMembroModalOpen}
		toggle={fecharMembroModal}
		on:open={() => document.querySelector<HTMLInputElement>('#nomeMembro')?.focus()}
	>
		<ModalHeader toggle={fecharMembroModal}>
			{editMembroId === null ? 'Adicionar Membro' : 'Editar Membro'}
		</ModalHeader>
		<ModalBody>
			<form onsubmit={salvarMembro}>
				<FormGroup>
					<Label for="nomeMembro">Nome do Membro</Label>
					<Input
						id="nomeMembro"
						name="nomeMembro"
						placeholder="Ex: João"
						bind:value={membroForm.nome}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="salarioBruto">Salário Bruto (R$)</Label>
					<Input
						type="number"
						id="salarioBruto"
						name="salarioBruto"
						placeholder="Ex: 3000"
						bind:value={membroForm.salarioBruto}
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
						bind:value={membroForm.taxaInss}
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
						bind:value={membroForm.taxaAlimentacao}
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
						bind:value={membroForm.taxaTransporte}
					/>
				</FormGroup>
				<FormGroup>
					<Label for="valeAlimentacao">Vale Alimentação (R$)</Label>
					<Input
						type="number"
						id="valeAlimentacao"
						name="valeAlimentacao"
						placeholder="Ex: 500"
						bind:value={membroForm.valeAlimentacao}
					/>
				</FormGroup>
				<ModalFooter>
					<Button color="secondary" onclick={fecharMembroModal}>Cancelar</Button>
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

	<!-- Modal de Confirmação de Remoção de Membro -->
	<Modal isOpen={isRemoverMembroModalOpen} toggle={fecharRemoverMembroModal}>
		<ModalHeader toggle={fecharRemoverMembroModal}>Confirmar Remoção</ModalHeader>
		<ModalBody>
			<p>Tem certeza que deseja remover este membro?</p>
		</ModalBody>
		<ModalFooter>
			<Button color="secondary" onclick={fecharRemoverMembroModal}>Cancelar</Button>
			<Button color="danger" onclick={confirmarRemoverMembro}>Remover</Button>
		</ModalFooter>
	</Modal>
</div>
