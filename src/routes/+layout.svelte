<script lang="ts">
	import '../app.css';
	import { remult, Remult } from 'remult';
	import { createSubscriber } from 'svelte/reactivity';
	import type { LayoutProps } from './$types';
	import { createToaster, Toast, Progress } from '@skeletonlabs/skeleton-svelte';
	import { setContext } from 'svelte';
	import { navigating } from '$app/state';

	let { children, data }: LayoutProps = $props();

	$inspect(navigating);

	const toaster = createToaster();
	setContext('toaster', toaster);

	// To be done once in the application.
	function initRemultSvelteReactivity() {
		// Auth reactivity (remult.user, remult.authenticated(), ...)
		{
			let update = () => {};

			let s = createSubscriber((u) => {
				update = u;
			});

			remult.subscribeAuth({
				reportObserved: () => s(),
				reportChanged: () => update()
			});
		}

		// Entities reactivity
		{
			Remult.entityRefInit = (x) => {
				let update = () => {};

				let s = createSubscriber((u) => {
					update = u;
				});

				x.subscribe({
					reportObserved: () => s(),
					reportChanged: () => update()
				});
			};
		}
	}

	initRemultSvelteReactivity();
</script>

{#if navigating.to}
	<Progress value={null} class="absolute top-0 left-0 z-[999] w-full">
		<Progress.Track>
			<Progress.Range />
		</Progress.Track>
	</Progress>
{/if}

{@render children?.()}

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>
