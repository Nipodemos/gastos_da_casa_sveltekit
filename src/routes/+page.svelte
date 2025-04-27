<script lang="ts">
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-french-toast';
	import TelaDespesas from './despesas.svelte';
	import TelaPessoas from './pessoas.svelte';

	import { getPessoas, carregarPessoas } from '$lib/pessoas.store.svelte';
	import { getDespesas, carregarDespesas } from '$lib/despesas.store.svelte';

	const pessoas = getPessoas();
	const despesas = getDespesas();
	// Interfaces para os dados do Supabase

	interface Divisao {
		nome: string;
		valorPagar: string;
		proporcao: string;
	}

	// Estado reativo com $state

	// Carregar dados do Supabase ao montar o componente
	onMount(async () => {
		await carregarDespesas();
		await carregarPessoas();
	});

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
</script>

<Toaster />

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
				<TelaDespesas />
			</section>

			<!-- Seção de Pessoas -->
			<section id="membros" class="col-md-6 mb-5">
				<TelaPessoas />
			</section>
		</div>
	</main>
</div>
