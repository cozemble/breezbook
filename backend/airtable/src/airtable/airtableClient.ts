import { ValueType } from '@breezbook/packages-core';

export interface RecordId extends ValueType<string> {
	_type: 'recordId';
}

export interface AirtableClient {
	createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<RecordId>;

	updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<void>;
}

export class StubAirtableClient implements AirtableClient {
	constructor(
		private recordIndex = 100,
		public records: { recordId: string; baseId: string; table: string; fields: Record<string, any> }[] = []
	) {}

	async createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<RecordId> {
		const recordId = `rec` + this.recordIndex++;
		this.records.push({ recordId, baseId, table, fields });
		return { _type: 'recordId', value: recordId };
	}

	async updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<void> {
		const record = this.records.find((record) => record.recordId === recordId);
		if (!record) {
			throw new Error(`No such record with id ${recordId}`);
		}
		record.fields = { ...record.fields, ...fields };
		this.records = this.records.filter((record) => record.recordId !== recordId);
		this.records.push(record);
		return;
	}
}

export interface AccessTokenProvider {
	getAccessToken(): Promise<string>;
}

export class HttpAirtableClient implements AirtableClient {
	constructor(
		private readonly baseUrl: string,
		private readonly accessTokenProvider: AccessTokenProvider
	) {}

	async createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<RecordId> {
		const accessToken = await this.accessTokenProvider.getAccessToken();
		const response = await fetch(`${this.baseUrl}/${baseId}/${table}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ fields })
		});
		if (!response.ok) {
			console.log(JSON.stringify({ fields }));
			throw new Error(`Failed to create record in Airtable table ${table}: ${response.status} ${response.statusText}`);
		}
		const json = await response.json();
		return { _type: 'recordId', value: json.id };
	}

	async updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<void> {
		const accessToken = await this.accessTokenProvider.getAccessToken();
		const response = await fetch(`${this.baseUrl}/${baseId}/${table}/${recordId}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ fields })
		});
		if (!response.ok) {
			throw new Error(`Failed to update record in Airtable: ${response.status} ${response.statusText}`);
		}
	}
}
