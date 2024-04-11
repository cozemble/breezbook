import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const region = "europe-west1";

const bucket = new gcp.storage.Bucket("bucket", {location: "europe-west1"});
const bucketObject = new gcp.storage.BucketObject("bucketObject", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../functions/poll-changes/dist"),
    }),
});

const topic = new gcp.pubsub.Topic('topic');

const pollChanges = new gcp.cloudfunctions.Function("pollChanges", {
    runtime: "nodejs20",
    entryPoint: "pollChanges",
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObject.name,
    eventTrigger: {
        eventType: 'google.pubsub.topic.publish',
        resource: topic.id,
    },
    availableMemoryMb: 256,
    region
});

const functionIamMember = new gcp.cloudfunctions.FunctionIamMember("functionIamMember", {
    cloudFunction: pollChanges.name,
    role: "roles/cloudfunctions.invoker",
    member: "serviceAccount:cozemble@appspot.gserviceaccount.com",
    region
});

const job = new gcp.cloudscheduler.Job("job", {
    region,
    schedule: "*/5 * * * *",
    pubsubTarget: {
        topicName: topic.id,
        data: Buffer.from("Trigger").toString('base64'),
    },
});

export const url = pollChanges.httpsTriggerUrl;