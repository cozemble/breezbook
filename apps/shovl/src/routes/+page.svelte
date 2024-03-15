<script lang="ts">
	import AirtableOauth from '../lib/components/AirtableOauth.svelte';
	import AirtableAccessToken from '$lib/components/AirtableAccessToken.svelte';
</script>

<main class="m-2 p-2">
	<div>
		<AirtableAccessToken />
	</div>

	<AirtableOauth />
</main>