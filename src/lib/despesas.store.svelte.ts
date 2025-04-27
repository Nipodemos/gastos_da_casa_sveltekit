import { supabase } from '$lib/supabaseClient';
interface Despesa {
	id: number;
	nome: string;
	valor: number;
}

let despesas = $state<Despesa[]>([]);
export function getDespesas() {
	return despesas;
}
// Função para carregar despesas do Supabase
export async function carregarDespesas() {
	const { data, error } = await supabase.from('despesas').select('*');
	if (error) {
		console.error('Erro ao carregar despesas:', error.message);
		return;
	}
	despesas = data || [];
}
