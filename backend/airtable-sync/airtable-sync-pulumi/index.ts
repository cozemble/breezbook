import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as dotenv from 'dotenv';
import {
    onChangeForTenantEnvironmentTopicName,
    onChangesForEnvironmentTopicName,
    onPollChangesTopicName
} from "@breezbook/backend-airtable-sync-shared";

dotenv.config({path: "../.env", debug: true, override: true});

const region = "europe-west1";

const bucket = new gcp.storage.Bucket("bucket", {location: "europe-west1"});
const bucketObject = new gcp.storage.BucketObject("bucketObject", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../functions/poll-changes/dist"),
    }),
});

const onPollChangesTopic = new gcp.pubsub.Topic(onPollChangesTopicName);
const onChangesForEnvironmentTopic = new gcp.pubsub.Topic(onChangesForEnvironmentTopicName, {
    messageRetentionDuration: "604800s" // Retention for 7 days
});
const onChangeForTenantEnvironmentTopic = new gcp.pubsub.Topic(onChangeForTenantEnvironmentTopicName, {
    messageRetentionDuration: "604800s" // Retention for 7 days
});

const pollChanges = new gcp.cloudfunctions.Function("pollChanges", {
    runtime: "nodejs20",
    entryPoint: "pollChanges",
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObject.name,
    eventTrigger: {
        eventType: 'google.pubsub.topic.publish',
        resource: onPollChangesTopic.id,
    },
    availableMemoryMb: 256,
    region,
    environmentVariables: {
        BREEZBOOK_URL_ROOT: process.env.BREEZBOOK_URL_ROOT,
        INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
        ON_CHANGES_FOR_ENVIRONMENT_TOPIC_ID: onChangesForEnvironmentTopic.id,
    }
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
        topicName: onPollChangesTopic.id,
        data: Buffer.from("Trigger").toString('base64'),
    },
});


const bucketObject_handleChangesForOneEnvironment = new gcp.storage.BucketObject("bucketObject_handleChangesForOneEnvironment", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        // path for the new function
        ".": new pulumi.asset.FileArchive("../functions/handle-changes-for-one-environment/dist"),
    }),
});

const handleChangesForOneEnvironment = new gcp.cloudfunctions.Function("handleChangesForOneEnvironment", {
    runtime: "nodejs20",
    entryPoint: "handleChangesForOneEnvironment",
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObject_handleChangesForOneEnvironment.name,
    eventTrigger: {
        eventType: 'google.pubsub.topic.publish',
        resource: onChangesForEnvironmentTopic.id,
        retrySettings: {
            retryOnFailure: true,
            maxAttempts: 0
        }
    },
    availableMemoryMb: 256,
    region,
    environmentVariables: {
        // Add necessary environment variables
        // Like this: VAR_NAME: process.env.VAR_NAME
    }
}, { dependsOn: onChangesForEnvironmentTopic });

const functionIamMember_handleChangesForOneEnvironment = new gcp.cloudfunctions.FunctionIamMember("functionIamMember_handleChangesForOneEnvironment", {
    cloudFunction: handleChangesForOneEnvironment.name,
    role: "roles/cloudfunctions.invoker",
    member: "serviceAccount:cozemble@appspot.gserviceaccount.com",
    region
}, { dependsOn: handleChangesForOneEnvironment });

// ... other code