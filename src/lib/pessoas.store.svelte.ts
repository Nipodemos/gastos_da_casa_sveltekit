import { supabase } from '$lib/supabaseClient';
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
let pessoas = $state<Pessoa[]>([]);

export function getPessoas() {
	return pessoas;
}

// Função para carregar pessoas do Supabase
export async function carregarPessoas() {
	const { data, error } = await supabase.from('pessoas').select('*');
	if (error) {
		console.error('Erro ao carregar pessoas:', error.message);
		return;
	}
	pessoas = data || [];
}

// Função para adicionar uma nova pessoa ao Supabase
export async function adicionarPessoa(pessoa: Pessoa) {
	const { data, error } = await supabase.from('pessoas').insert(pessoa);
	if (error) {
		console.error('Erro ao adicionar pessoa:', error.message);
		return;
	}
	if (data && data.length > 0) {
		// Adiciona a nova pessoa ao array local
		pessoas.push(data[0]);
	}
}
