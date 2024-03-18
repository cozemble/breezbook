<script lang="ts">
	import Airtable from 'airtable';

	export let accessToken:string

	const airtable = new Airtable({apiKey: accessToken})
	const base = airtable.base('appn1dysBKgmD9nhI')

	async function onUpsert() {
		const outcome = await base('Customers').update([
			{
				"id": "rec5vsV6TKOyLFymx",
				"fields": {
					"First name": "Tom",
					"Last name": "Hogan",
					"Email": "me@mikehogan.net",
					"Phone": "32423432",
					"Bookings": [
						"recV5y8PZnqVz9jVp",
						"recurNOD52VM2GvW1"
					]
				}
			}
		])
		console.log({outcome})
	}
</script>

<button class="btn btn-success" on:click={onUpsert}>Upsert</button>