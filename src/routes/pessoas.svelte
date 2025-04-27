<script lang="ts">
	import {
		Button,
		FormGroup,
		Input,
		Label,
		Modal,
		ModalBody,
		ModalFooter,
		ModalHeader
	} from '@sveltestrap/sveltestrap';
	import {
		getPessoas,
		adicionarPessoa,
		atualizarPessoa,
		deletarPessoa
	} from '$lib/pessoas.store.svelte';
	import toast from 'svelte-french-toast';

	// Estados para controlar os modals e índices de remoção
	let isPessoaModalOpen = $state(false);
	let removerPessoaId = $state<number | null>(null);
	let isRemoverPessoaModalOpen = $state(false);
	let pessoas = getPessoas(); // Lista de pessoas do store
	const totalRenda = $derived(pessoas.reduce((sum, p) => sum + p.salario_liquido, 0));
	// Valores dos formulários (para binding), agora com id

	let pessoaForm = $state({
		id: null as number | null,
		nome: '',
		salarioBruto: '',
		taxaInss: '0',
		taxaAlimentacao: '0',
		taxaTransporte: '0',
		valeAlimentacao: '0'
	});

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
				taxaInss: pessoa.taxa_inss?.toString() ?? '',
				taxaAlimentacao: pessoa.taxa_alimentacao?.toString() ?? '',
				taxaTransporte: pessoa.taxa_transporte?.toString() ?? '',
				valeAlimentacao: pessoa.vale_alimentacao?.toString() ?? ''
			};
			isPessoaModalOpen = true;
		}
	}

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
	// Funções para salvar os formulários

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
				const resultInsert = await adicionarPessoa(novaPessoa);
				if (resultInsert.status !== 'success') {
					toast.error('Erro ao adicionar pessoa: ' + resultInsert.message);
					return;
				}
				if (resultInsert.status === 'success') {
					toast.success('Pessoa adicionada com sucesso!');
				}
			} else {
				const resultInsert = await atualizarPessoa(pessoaForm.id, novaPessoa);
				if (resultInsert.status !== 'success') {
					toast.error('Erro ao adicionar pessoa: ' + resultInsert.message);
					return;
				} else if (resultInsert.status === 'success') {
					toast.success('Pessoa adicionada com sucesso!');
				}
			}

			isPessoaModalOpen = false;
		}
	}

	function abrirRemoverPessoa(id: number) {
		removerPessoaId = id;
		isRemoverPessoaModalOpen = true;
	}

	async function confirmarRemoverPessoa() {
		if (removerPessoaId === null) return; // Garante que removerPessoaId não é null
		const resultDelete = await deletarPessoa(removerPessoaId);
		if (resultDelete.status !== 'success') {
			toast.error('Erro ao remover pessoa: ' + resultDelete.message);
			return;
		} else if (resultDelete.status === 'success') {
			toast.success('Pessoa removida com sucesso!');
		}

		isRemoverPessoaModalOpen = false;
		removerPessoaId = null;
	}

	function fecharRemoverPessoaModal() {
		isRemoverPessoaModalOpen = false;
		removerPessoaId = null;
	}
</script>

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

<!-- Modal para Pessoas (Criação e Edição) -->
<Modal
	isOpen={isPessoaModalOpen}
	toggle={() => (isPessoaModalOpen = !isPessoaModalOpen)}
	on:open={() => document.querySelector<HTMLInputElement>('#nomePessoa')?.focus()}
>
	<ModalHeader toggle={() => (isPessoaModalOpen = !isPessoaModalOpen)}>
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
				<Button color="secondary" onclick={() => (isPessoaModalOpen = !isPessoaModalOpen)}
					>Cancelar</Button
				>
				<Button color="primary" type="submit">Salvar</Button>
			</ModalFooter>
		</form>
	</ModalBody>
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
