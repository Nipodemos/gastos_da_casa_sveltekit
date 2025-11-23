
export const load = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	let date = new Date();

	if (dateParam) {
		const [year, month] = dateParam.split('-').map(Number);
		if (!isNaN(year) && !isNaN(month)) {
			date = new Date(year, month - 1, 1);
		}
	}

	return {
		selectedDate: date.toISOString().slice(0, 7) // YYYY-MM
	};
};
