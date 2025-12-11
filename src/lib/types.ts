import { Pessoa } from "$shared/pessoa.model";

export interface PessoaCalculada extends Pessoa {
		porcentagemContribuicao: number;
		valorAPagar: number;
		sobraSalario: number;
		proporcaoReceita: number;
}