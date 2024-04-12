import {mandatory} from "@breezbook/packages-core";
import {ChangeDates} from "@breezbook/backend-api-types";

async function pollChanges() {
	console.log(`pollChanges called`);
	const breezbookUrlRoot = mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT');
	const changesUrl = breezbookUrlRoot + `/internal/api/changes/dates`;
	const internalApiKey = mandatory(process.env.INTERNAL_API_KEY, 'INTERNAL_API_KEY');
	const changesResponse = await fetch(changesUrl, {
		method: 'GET',
		headers: {
			Authorization: internalApiKey,
			'Content-Type': 'application/json'
		}
	});
	if (!changesResponse.ok) {
		throw new Error(`Failed to fetch changes from ${changesUrl}, got status ${changesResponse.status}`);
	}
	const changeDates:ChangeDates[] = await changesResponse.json();
	for (const changeDate of changeDates) {
		console.log(`changeDate: ${changeDate.environmentId} from ${changeDate.from} to ${changeDate.to}`)
	}
}

export { pollChanges };