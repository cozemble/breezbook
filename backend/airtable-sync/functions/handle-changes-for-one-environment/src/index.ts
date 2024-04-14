import { Message } from '@google-cloud/pubsub';
import {ChangeDates} from "@breezbook/backend-api-types";

export async function handleChangesForOneEnvironment(message: Message) {
    console.log(`handleChangesForOneEnvironment was called with message`, message);
    const changeDates = JSON.parse(message.data.toString()) as ChangeDates;
}
