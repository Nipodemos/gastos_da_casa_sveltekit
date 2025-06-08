import { supabase } from '$lib/supabaseClient';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (!session) {
		redirect(303, '/login');
	}

	const { data } = await supabase.from('instruments').select();

	return {
		instruments: data ?? []
	};
};