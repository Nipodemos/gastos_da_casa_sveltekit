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
	let botaoGravarDesabilitado = $state(false); // Estado para habilitar/desabilitar o botão de gravação
	let botaoGravarDeleteDesabilitado = $state(false); // Estado para habilitar/desabilitar o botão de gravação
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

		const descricao = despesaForm.descricao;
		const valor = parseFloat(despesaForm.valor);

		if (!descricao || valor <= 0) {
			toast.error('Preencha todos os campos corretamente!');

			return;
		}

		botaoGravarDesabilitado = true; // Desabilita o botão de gravação enquanto a operação está em andamento

		const dataHoraAtual = new Date().toISOString();
		const despesaData = { data: dataHoraAtual, descricao, valor };

		await toast.promise(
			despesaForm.id === null
				? adicionarDespesa(despesaData)
				: atualizarDespesa(despesaForm.id, despesaData),
			{
				loading:
					despesaForm.id === null
						? 'Adicionando despesa "' + despesaForm.descricao + '"...'
						: 'Atualizando despesa "' + despesaForm.descricao + '"...',
				success: () => {
					isDespesaModalOpen = false;
					botaoGravarDesabilitado = false; // Reabilita o botão de gravação
					despesaForm = { id: null, descricao: '', valor: '' }; // Limpa o formulário
					return despesaForm.id === null
						? 'Despesa "' + despesaForm.descricao + '" adicionada com sucesso!'
						: 'Despesa "' + despesaForm.descricao + '" atualizada com sucesso!';
				},
				error: (err) => {
					botaoGravarDesabilitado = false; // Reabilita o botão de gravação em caso de erro
					return `Erro ao ${despesaForm.id === null ? 'adicionar' : 'atualizar'} despesa: ${err.message}`;
				}
			}
		);
	}
	// Funções para remoção
	function abrirRemoverDespesa(id: number) {
		removerDespesaId = id;
		isRemoverDespesaModalOpen = true;
	}

	async function confirmarRemoverDespesa() {
		if (removerDespesaId === null) return; // Garante que removerDespesaId não é null
		botaoGravarDeleteDesabilitado = true; // Desabilita o botão de gravação enquanto a operação está em andamento
		await toast.promise(deletarDespesa(removerDespesaId), {
			loading: 'Removendo despesa...',
			success: () => {
				botaoGravarDeleteDesabilitado = false; // Reabilita o botão de gravação
				isRemoverDespesaModalOpen = false;
				removerDespesaId = null;
				return 'Despesa removida com sucesso!';
			},
			error: (err) => {
				botaoGravarDeleteDesabilitado = false; // Reabilita o botão de gravação em caso de erro
				return `Erro ao remover despesa: ${err.message}`;
			}
		});
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
				<Button color="primary" type="submit" disabled={botaoGravarDesabilitado}>Salvar</Button>
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
		<Button
			color="danger"
			disabled={botaoGravarDeleteDesabilitado}
			onclick={confirmarRemoverDespesa}>Remover</Button
		>
	</ModalFooter>
</Modal>
