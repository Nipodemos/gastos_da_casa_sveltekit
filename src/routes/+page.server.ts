import { supabase } from '$lib/supabaseClient';

export async function load() {
	const { data } = await supabase.from('instruments').select();
	const result = await supabase.from('instruments').insert([{ name: 'guitar' }]);
	console.log('result', result);
	return {
		instruments: data ?? []
	};
}
