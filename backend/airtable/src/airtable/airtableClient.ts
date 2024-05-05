import {ValueType} from '@breezbook/packages-core';

export interface RecordId extends ValueType<string> {
    _type: 'recordId';
}


export interface AirtableClientSuccess {
    _type: 'airtable.client.success';
    action: 'create' | 'update';
    baseId: string
    table: string
    recordId: RecordId;
    fields: Record<string, any>;
}

export interface AirtableClientFailure {
    _type: 'airtable.client.failure';
    action: 'create' | 'update';
    baseId: string;
    table: string;
    fields: Record<string, any>;
    error: string;
}

export function airtableClientSuccess(action: 'create' | 'update', baseId: string, table:string,recordId: RecordId, fields: Record<string, any>): AirtableClientSuccess {
    return {_type: 'airtable.client.success', action, baseId, table,recordId, fields};
}

export function airtableClientFailure(action: 'create' | 'update', baseId: string, table:string,error: string, fields: Record<string, any>): AirtableClientFailure {
    return {_type: 'airtable.client.failure', action, baseId,table, error, fields};
}

export type AirtableClientOutcome = AirtableClientSuccess | AirtableClientFailure;

export interface AirtableClient {
    createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<AirtableClientOutcome>;

    updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<AirtableClientOutcome>;
}

export class StubAirtableClient implements AirtableClient {
    constructor(
        private recordIndex = 100,
        public records: { recordId: string; baseId: string; table: string; fields: Record<string, any> }[] = []
    ) {
    }

    async createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<AirtableClientOutcome> {
        const recordId = `rec` + this.recordIndex++;
        this.records.push({recordId, baseId, table, fields});
        return airtableClientSuccess('create', baseId, table,{_type: 'recordId', value: recordId}, fields);
    }

    async updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<AirtableClientOutcome> {
        const record = this.records.find((record) => record.recordId === recordId);
        if (!record) {
            return airtableClientFailure('update', baseId, table,`No such record with id ${recordId}`, fields);
        }
        record.fields = {...record.fields, ...fields};
        this.records = this.records.filter((record) => record.recordId !== recordId);
        this.records.push(record);
        return airtableClientSuccess('update', baseId, table,{_type: 'recordId', value: recordId}, fields);
    }
}

export interface AccessTokenProvider {
    getAccessToken(): Promise<string>;
}

export class HttpAirtableClient implements AirtableClient {
    constructor(
        private readonly baseUrl: string,
        private readonly accessTokenProvider: AccessTokenProvider
    ) {
    }

    async createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<AirtableClientOutcome> {
        const accessToken = await this.accessTokenProvider.getAccessToken();
        const url = `${this.baseUrl}/${baseId}/${table}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fields})
        });
        if (!response.ok) {
            console.log(`fields = ${JSON.stringify(fields, null, 2)}`);
            return airtableClientFailure('create', baseId, table,`Failed to create record in Airtable table '${table}' (url ${url}) : ${response.status} ${response.statusText}`, fields);
        }
        const json = await response.json();
        const recId = json.id;
        if (!recId) {
            return airtableClientFailure('create', baseId, table,`Failed to create record in Airtable table ${table}: no record id returned`, fields);
        }
        const recordId: RecordId = {_type: 'recordId', value: recId};
        return airtableClientSuccess('create', baseId,table, recordId, fields);
    }

    async updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<AirtableClientOutcome> {
        const accessToken = await this.accessTokenProvider.getAccessToken();
        const  url = `${this.baseUrl}/${baseId}/${table}/${recordId}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fields})
        });
        if (!response.ok) {
            console.log(`fields = ${JSON.stringify(fields, null, 2)}`);
            return airtableClientFailure('update', baseId, table,`Failed to update record in Airtable table '${table}' (url ${url}): ${response.status} ${response.statusText}`, fields);
        }
        return airtableClientSuccess('update', baseId, table,{_type: 'recordId', value: recordId}, fields);
    }
}
