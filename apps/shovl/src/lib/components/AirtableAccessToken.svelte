<script lang="ts">
	import { airtableAccessToken } from '$lib/stores/airtable/airtableAuth';
</script>

<input type="text" class="input input-bordered w-full" bind:value={$airtableAccessToken} placeholder="Airtable Access Token" />