<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Button,
		Card,
		CardBody,
		CardHeader,
		Col,
		Container,
		Form,
		FormGroup,
		Input,
		Row,
		Alert
	} from '@sveltestrap/sveltestrap';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let loading = $state(false);
	let email = $state(form?.email ?? '');
	let password = $state('');
</script>

<svelte:head>
	<title>Login - Gastos da Casa</title>
</svelte:head>

<div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
	<Container>
		<Row class="justify-content-center">
			<Col md={6} lg={5} xl={4}>
				<Card class="shadow-lg border-0">
					<CardHeader class="bg-primary text-white text-center py-4">
						<h1 class="h3 mb-0 fw-bold">Gastos da Casa</h1>
						<p class="mb-0 opacity-75">Faça login para continuar</p>
					</CardHeader>
					<CardBody class="p-4">
						{#if form?.error}
							<Alert color="danger" class="mb-4">
								<i class="bi bi-exclamation-triangle-fill me-2"></i>
								{form.error}
							</Alert>
						{/if}

						<Form method="POST">
							<FormGroup class="mb-3">
								<label for="email" class="form-label fw-semibold">
									<i class="bi bi-envelope me-2"></i>Email
								</label>
								<Input
									type="email"
									id="email"
									name="email"
									placeholder="seu@email.com"
									bind:value={email}
									required
									class="form-control-lg"
									invalid={form?.error!! && !email ? true : false}
								/>
							</FormGroup>

							<FormGroup class="mb-4">
								<label for="password" class="form-label fw-semibold">
									<i class="bi bi-lock me-2"></i>Senha
								</label>
								<Input
									type="password"
									id="password"
									name="password"
									placeholder="Digite sua senha"
									bind:value={password}
									required
									class="form-control-lg"
									invalid={form?.error!! && !password ? true : false}
								/>
							</FormGroup>

							<div class="d-grid">
								<Button
									type="submit"
									color="primary"
									size="lg"
									disabled={loading}
									class="fw-semibold"
								>
									{#if loading}
										<span
											class="spinner-border spinner-border-sm me-2"
											role="status"
											aria-hidden="true"
										></span>
										Entrando...
									{:else}
										<i class="bi bi-box-arrow-in-right me-2"></i>
										Entrar
									{/if}
								</Button>
							</div>
						</Form>
					</CardBody>
				</Card>

				<div class="text-center mt-4">
					<small class="text-muted">
						<i class="bi bi-shield-check me-1"></i>
						Seus dados estão protegidos e seguros
					</small>
				</div>
			</Col>
		</Row>
	</Container>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
</style>
