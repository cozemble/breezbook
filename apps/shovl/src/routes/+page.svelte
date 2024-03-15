<script context="module" lang="ts">

	export async function load({ page, fetch }) {
		const param = page.query.get('param');
		return {
			props: {
				param
			}
		};
	}
</script>

<script lang="ts">
	import AirtableOauth from '../lib/components/AirtableOauth.svelte';

	export let param: string;
</script>

<AirtableOauth {param} />