import {test, expect} from "vitest"
import {fetchAndFanoutChanges} from "../src/index.js";
import {ChangeDates} from "@breezbook/backend-api-types";

test("does nothing with no changes", async () => {
    await fetchAndFanoutChanges(async () => [], async () => {
        throw new Error("Should not be called");
    });
})

test("publishes when it finds one change", async () => {
    const change:ChangeDates = {environmentId: "env1", from: "2021-01-01", to: "2021-01-02"};
    const fetcher = async () => [change];
    const publishedChanges:ChangeDates[] = [];
    await fetchAndFanoutChanges(fetcher, async (change) => {
        publishedChanges.push(change);
    });
    expect(publishedChanges).toEqual([change]);
});

test("publishes when it finds two changes", async () => {
    const change1:ChangeDates = {environmentId: "env1", from: "2021-01-01", to: "2021-01-02"};
    const change2:ChangeDates = {environmentId: "env2", from: "2021-02-02", to: "2021-02-03"};
    const fetcher = async () => [change1, change2];
    const publishedChanges:ChangeDates[] = [];
    await fetchAndFanoutChanges(fetcher, async (change) => {
        publishedChanges.push(change);
    });
    expect(publishedChanges).toEqual([change1, change2]);
});