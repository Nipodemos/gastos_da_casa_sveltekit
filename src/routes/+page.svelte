<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let formulario = $state({
		senha: ''
	});
	let submitting = $state(false);
</script>

<h1>Login</h1>

<form method="POST" use:enhance>
	<label>
		Senha
		<input name="senha" type="password" value={formulario.senha} />
	</label>
	<button type="submit" disabled={submitting}>
		{submitting ? 'Entrando...' : 'Entrar'}
	</button>

	{#if form?.error}
		<p style="color: red;">{form.error}</p>
	{/if}
</form>
