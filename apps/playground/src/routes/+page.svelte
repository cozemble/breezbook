<script lang="ts">
	import { isoDate, isoDateFns } from '@breezbook/packages-core';
	import OrderPostForm from './OrderPostForm.svelte';
	import { endpoint } from './endpoint';

	let selectedCarWash = 'smallCarWash';
	let fromDate = isoDate().value;
	let toDate = isoDateFns.addDays(isoDate(), 7).value;
	let availability: unknown = null;
	let endpointType = 'local';

	$: {
		if (endpointType === 'local') {
			$endpoint = 'http://127.0.0.1:3000';
		} else {
			$endpoint = 'https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app';
		}
	}

	async function onGetAvailability() {
		const response = await fetch(`${$endpoint}/api/tenant1/service/${selectedCarWash}/availability?fromDate=${fromDate}&toDate=${toDate}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});
		if (response.ok) {
			availability = await response.json();
		} else {
			availability = await response.text();
		}
	}
</script>
<h4>Endpoint</h4>
<!-- radio group of two items -->
<div>
	<input type="radio" bind:group={endpointType} value="local" id="local" />
	<label for="local">Local</label>
	<input type="radio" bind:group={endpointType} value="remote" id="remote" />
	<label for="remote">Remote</label>
</div>
<h4>Get availability</h4>
<div>
	<form>
		<select bind:value={selectedCarWash}>
			<option value="smallCarWash" selected={selectedCarWash ==="smallCarWash"}>Small Car Wash</option>
			<option value="mediumCarWash" selected={selectedCarWash ==="mediumCarWash"}>Medium Car Wash</option>
			<option value="largeCarWash" selected={selectedCarWash ==="largeCarWash"}>Large Car Wash</option>
		</select>
		<label for="fromDate">From Date</label>
		<input type="date" bind:value={fromDate} id="fromDate" />
		<label for="toDate">To Date</label>
		<input type="date" bind:value={toDate} id="toDate" />
		<button type="submit" on:click|preventDefault={onGetAvailability}>Get Availability</button>
	</form>
</div>
<div>
	<label for="availabilityResponse">Availability response</label>
	<textarea id="availabilityResponse" rows="20" cols="100" readonly>{JSON.stringify(availability, null, 2)}</textarea>
</div>

<h4>Post order</h4>

<OrderPostForm />