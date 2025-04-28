import { supabase } from '$lib/supabaseClient';
import type { Database } from '$lib/types/supabase_types';

type Despesa = Database['public']['Tables']['despesas']['Row'];
type DespesaInsert = Database['public']['Tables']['despesas']['Insert'];
type DespesaUpdate = Database['public']['Tables']['despesas']['Update'];

interface OperationResult {
	status: 'success' | 'error';
	message?: string;
}

let despesas = $state<Despesa[]>([]);

export function getDespesas() {
	return despesas;
}

// Função para carregar despesas do Supabase
export async function carregarDespesas(): Promise<OperationResult> {
	const { data, error } = await supabase.from('despesas').select('*');
	if (error) {
		return {
			status: 'error',
			message: traduzirErro(error.message)
		};
	}
	despesas = data || [];
	return { status: 'success' };
}

// Função para adicionar uma nova despesa ao Supabase
export async function adicionarDespesa(despesa: DespesaInsert): Promise<OperationResult> {
	const { data, error } = await supabase.from('despesas').insert(despesa).select();
	if (error) {
		console.error(error);
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	}
	if (data && data.length > 0) {
		despesas.push(data[0]);
	} else {
		throw new Error('Erro desconhecido ao inserir a despesa'); // Rejeita com erro
	}
	return { status: 'success' };
}

// Função para atualizar uma despesa no Supabase
export async function atualizarDespesa(
	id: number,
	updates: DespesaUpdate
): Promise<OperationResult> {
	updates.updated_at = new Date().toISOString(); // Define a data atual
	const { data, error } = await supabase.from('despesas').update(updates).eq('id', id).select();
	if (error) {
		console.error(error);
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	}
	if (data && data.length > 0) {
		const index = despesas.findIndex((d) => d.id === id);
		if (index !== -1) {
			despesas[index] = data[0];
		}
	} else {
		throw new Error('Erro desconhecido ao atualizar a despesa'); // Rejeita com erro
	}
	return { status: 'success' };
}

// Função para deletar uma despesa do Supabase
export async function deletarDespesa(id: number): Promise<OperationResult> {
	const { error } = await supabase.from('despesas').delete().eq('id', id);
	if (error) {
		throw new Error(traduzirErro(error.message)); // Rejeita com erro
	}
	// Remove a despesa localmente
	despesas = despesas.filter((d) => d.id !== id);
	return { status: 'success' };
}

// Função para traduzir erros do Supabase em mensagens amigáveis
function traduzirErro(errorMessage: string): string {
	if (errorMessage.includes('duplicate key value')) {
		return 'Esta despesa já está registrada.';
	} else if (errorMessage.includes('NetworkError')) {
		return 'Erro de conexão. Verifique sua internet e tente novamente.';
	} else if (errorMessage.includes('violates row-level security')) {
		return 'Você não tem permissão para acessar este recurso.';
	}
	return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
}
