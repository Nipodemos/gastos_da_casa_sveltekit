<script lang="ts">
	import { enhance } from '$app/forms';
	import { Col, Container, Form, FormGroup, Input, Row } from '@sveltestrap/sveltestrap';

	let dadosFormulario = $state({
		login: {
			status: '',
			feedback: '',
			value: ''
		},
		senha: {
			status: '',
			feedback: '',
			value: ''
		}
	});
</script>

<Container sm>
	<Row style="height: 900px; align-items: center">
		<Col sm={{ size: 4, offset: 4 }}>
			<Form>
				<FormGroup floating label="Email*">
					<Input
						type="email"
						placeholder="Email"
						name="login"
						valid={dadosFormulario.login.status === 'ok'}
						invalid={dadosFormulario.login.status === 'error'}
						feedback={dadosFormulario.login.feedback}
						bind:value={dadosFormulario.login.value}
					/>
				</FormGroup>
				<FormGroup floating label="Senha*">
					<Input
						type="password"
						placeholder="Senha"
						name="senha"
						valid={dadosFormulario.senha.status === 'ok'}
						invalid={dadosFormulario.senha.status === 'error'}
						feedback={dadosFormulario.senha.feedback}
						bind:value={dadosFormulario.senha.value}
					/>
				</FormGroup>
			</Form>
		</Col>
	</Row>
</Container>
