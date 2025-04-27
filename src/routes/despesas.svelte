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
	import toast from 'svelte-french-toast';
	import {
		getDespesas,
		adicionarDespesa,
		atualizarDespesa,
		deletarDespesa
	} from '$lib/despesas.store.svelte';
	let despesas = getDespesas();
	let isDespesaModalOpen = $state(false);
	let isRemoverDespesaModalOpen = $state(false);
	let removerDespesaId = $state<number | null>(null);
	const totalDespesas = $derived(despesas.reduce((sum, d) => sum + d.valor, 0));
	let despesaForm = $state({ id: null as number | null, descricao: '', valor: '' });
	// Funções para abrir os modals
	function abrirAdicionarDespesa() {
		despesaForm = { id: null, descricao: '', valor: '' };
		isDespesaModalOpen = true;
	}
	function abrirEditarDespesa(id: number) {
		const despesa = despesas.find((d) => d.id === id);
		if (despesa) {
			despesaForm = {
				id: despesa.id,
				descricao: despesa.descricao,
				valor: despesa.valor.toString()
			};
			isDespesaModalOpen = true;
		}
	}
	async function salvarDespesa(event: SubmitEvent) {
		event.preventDefault();
		let submitButton = event.submitter; // Tenta pegar o submitter
		if (!submitButton) {
			// Se submitter for null (ex.: envio por Enter), busca o primeiro botão de submit
			submitButton = document.querySelector('button[type="submit"]');
		}
		const descricao = despesaForm.descricao;
		const valor = parseFloat(despesaForm.valor);
		if (descricao && valor > 0) {
			if (despesaForm.id === null) {
				const dataHoraAtual = new Date().toLocaleString();
				const resultInsert = await adicionarDespesa({ data: dataHoraAtual, descricao, valor });
				if (resultInsert.status !== 'success') {
					toast.error('Erro ao adicionar despesa: ' + resultInsert.message);
					return;
				}
				if (resultInsert.status === 'success') {
					toast.success('Despesa adicionada com sucesso!');
				}
			} else {
				const dataHoraAtual = new Date().toLocaleString();
				const resultInsert = await atualizarDespesa(despesaForm.id, {
					data: dataHoraAtual,
					descricao,
					valor
				});
				if (resultInsert.status !== 'success') {
					toast.error('Erro ao adicionar despesa: ' + resultInsert.message);
					return;
				} else if (resultInsert.status === 'success') {
					toast.success('Despesa adicionada com sucesso!');
				}
			}

			isDespesaModalOpen = false;
		}
	}
	// Funções para remoção
	function abrirRemoverDespesa(id: number) {
		removerDespesaId = id;
		isRemoverDespesaModalOpen = true;
	}

	async function confirmarRemoverDespesa() {
		if (removerDespesaId === null) return; // Garante que removerDespesaId não é null
		const resultDelete = await deletarDespesa(removerDespesaId);
		if (resultDelete.status !== 'success') {
			toast.error('Erro ao remover despesa: ' + resultDelete.message);
			return;
		} else if (resultDelete.status === 'success') {
			toast.success('Despesa removida com sucesso!');
		}

		isRemoverDespesaModalOpen = false;
		removerDespesaId = null;
	}

	function fecharRemoverDespesaModal() {
		isRemoverDespesaModalOpen = false;
		removerDespesaId = null;
	}
</script>

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
						<td>{despesa.descricao}</td>
						<td>R$ {despesa.valor.toFixed(2)}</td>
						<td class="text-end">
							<Button
								color="primary"
								size="sm"
								class="me-2"
								onclick={() => abrirEditarDespesa(despesa.id)}>Editar</Button
							>
							<Button color="danger" size="sm" onclick={() => abrirRemoverDespesa(despesa.id)}
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

<!-- Modal para Despesas (Criação e Edição) -->
<Modal
	isOpen={isDespesaModalOpen}
	toggle={() => (isDespesaModalOpen = !isDespesaModalOpen)}
	on:open={() => document.querySelector<HTMLInputElement>('#nomeDespesa')?.focus()}
>
	<ModalHeader toggle={() => (isDespesaModalOpen = !isDespesaModalOpen)}>
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
					bind:value={despesaForm.descricao}
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
				<Button color="secondary" onclick={() => (isDespesaModalOpen = !isDespesaModalOpen)}
					>Cancelar</Button
				>
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
