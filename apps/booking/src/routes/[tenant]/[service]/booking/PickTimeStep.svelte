<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import DayList from '$lib/components/time/DayList.svelte';

	let status: string;

	const setSuccess = () => {
		status = 'success';
	};

	const setWarning = () => {
		status = 'warning';
	};

	const setError = () => {
		status = 'error';
	};

	const setInfo = () => {
		status = 'info';
	};
</script>

<AccordionItem
	name="booking-steps"
	label="Pick a time"
	{status}
	collapsedDetails="Wed, 11 Dec 14:00 - 17:00"
>
	<DayList />
	<button on:click={setSuccess} class="btn">Set Success</button>
	<button on:click={setWarning} class="btn">Set Warning</button>
	<button on:click={setError} class="btn">Set Error</button>
	<button on:click={setInfo} class="btn">Set Info</button>
</AccordionItem>
