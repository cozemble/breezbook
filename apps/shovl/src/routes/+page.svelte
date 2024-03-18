<script lang="ts">
	import AirtablePlay from '$lib/components/AirtablePlay.svelte';
	import AirtableAccessToken from '$lib/components/AirtableAccessToken.svelte';
	import { airtableAccessToken } from '$lib/stores/airtable/airtableAuth';
</script>

<main class="m-2 p-2">
	<div>
		<AirtableAccessToken />
	</div>

	{#if $airtableAccessToken}
		<AirtablePlay accessToken={$airtableAccessToken}/>
	{/if}
</main>