import { supabase } from '$lib/supabaseClient';
import type { Database } from '$lib/types/supabase_types';

type Pessoa = Database['public']['Tables']['pessoas']['Row'];
type PessoaInsert = Database['public']['Tables']['pessoas']['Insert'];
type PessoaUpdate = Database['public']['Tables']['pessoas']['Update'];

export interface OperationResult {
	status: 'success' | 'error';
	message?: string;
}

let pessoas = $state<Pessoa[]>([]);

export function getPessoas() {
	return pessoas;
}

// Função para carregar pessoas do Supabase
export async function carregarPessoas(): Promise<OperationResult> {
	const { data, error } = await supabase.from('pessoas').select('*');
	if (error) {
		return {
			status: 'error',
			message: traduzirErro(error.message)
		};
	}
	pessoas = data || [];
	return { status: 'success' };
}

// Função para adicionar uma nova pessoa ao Supabase
export async function adicionarPessoa(pessoa: PessoaInsert): Promise<OperationResult> {
	const { data, error } = await supabase.from('pessoas').insert(pessoa).select();
	if (error) {
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	} else if (data && data.length > 0) {
		pessoas.push(data[0]);
		return { status: 'success' };
	} else {
		throw new Error('Erro desconhecido ao inserir a pessoa'); // Rejeita com erro
	}
}

// Função para atualizar uma pessoa no Supabase
export async function atualizarPessoa(id: number, updates: PessoaUpdate): Promise<OperationResult> {
	updates.updated_at = new Date().toISOString(); // Define a data atual
	const { data, error } = await supabase.from('pessoas').update(updates).eq('id', id).select();
	if (error) {
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	} else if (data && data.length > 0) {
		const index = pessoas.findIndex((p) => p.id === id);
		if (index !== -1) {
			pessoas[index] = data[0];
		}
		return { status: 'success' };
	} else {
		throw new Error('Erro desconhecido ao inserir a pessoa'); // Rejeita com erro
	}
}

// Função para deletar uma pessoa do Supabase
export async function deletarPessoa(id: number): Promise<OperationResult> {
	const { error } = await supabase.from('pessoas').delete().eq('id', id);
	if (error) {
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	}
	pessoas = pessoas.filter((p) => p.id !== id);
	return { status: 'success' };
}

// Função para traduzir erros do Supabase em mensagens amigáveis
function traduzirErro(errorMessage: string): string {
	if (errorMessage.includes('duplicate key value')) {
		return 'Este email já está registrado.';
	}
	if (errorMessage.includes('NetworkError')) {
		return 'Erro de conexão. Verifique sua internet e tente novamente.';
	}
	return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
}
