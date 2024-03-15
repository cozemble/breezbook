<script lang="ts">

	export let paramValue: string;

</script>

{#if paramValue === 'hello'}
	Hello
{:else if paramValue === 'goodbye'}
	Goodbye
{/if}