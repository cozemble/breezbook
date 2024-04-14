import {mandatory} from "@breezbook/packages-core";
import {ChangeDates} from "@breezbook/backend-api-types";
import {PubSub} from '@google-cloud/pubsub';


export async function pollChanges() {
    console.log(`pollChanges called`);
    await fetchAndFanoutChanges(
        httpChangeFetcher(
            mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT'),
            mandatory(process.env.INTERNAL_API_KEY, 'INTERNAL_API_KEY')),
        pubSubObjectPublisher(
            mandatory(process.env.ON_CHANGES_FOR_ENVIRONMENT_TOPIC_ID, 'ON_CHANGES_FOR_ENVIRONMENT_TOPIC_ID'),
            change => change.environmentId));
}

type ChangeFetcher = () => Promise<ChangeDates[]>;
type ObjectPublisher<T> = (object: T) => Promise<void>;

export async function fetchAndFanoutChanges(fetcher: ChangeFetcher, publisher: ObjectPublisher<ChangeDates>) {
    const changes = await fetcher();
    for (const change of changes) {
        await publisher(change);
    }
}

function httpChangeFetcher(breezbookUrlRoot: string, internalApiKey: string): ChangeFetcher {
    return async () => {
        const changesUrl = breezbookUrlRoot + `/internal/api/changes/dates`;
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
        return await changesResponse.json();
    }
}

type OrderingKeyProvider<T> = (t: T) => string;

export function pubSubObjectPublisher<T>(pubsubTopic: string, orderingKeyProvider: OrderingKeyProvider<T> | null, pubsub: PubSub = new PubSub()): ObjectPublisher<T> {
    return async (t: T) => {
        const dataBuffer = Buffer.from(JSON.stringify(t), 'utf8');

        const messageId = await pubsub.topic(pubsubTopic).publishMessage({
            data: dataBuffer,
            orderingKey: orderingKeyProvider ? orderingKeyProvider(t) : undefined
        });

        console.log(`Message ${messageId} published.`);
    }
}