<script>
	const { data } = $props();
	$inspect(data);
</script>

ola
<ul>
	{#each data.instruments as country}
		<li>{country.name}</li>
	{/each}
</ul>
