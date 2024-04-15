import * as aws from "@pulumi/aws";
import * as dotenv from 'dotenv';
import { onChangeForTenantEnvironmentTopicName, onChangesForEnvironmentTopicName, onPollChangesTopicName } from "@breezbook/backend-airtable-sync-shared";
import "@pulumi/aws/serverless/function";

dotenv.config({path: "../.env", debug: true, override: true});
const region = "eu-west-1";

const iamRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ "Service": "lambda.amazonaws.com" })
});

new aws.iam.RolePolicyAttachment("lambdaFullAccess", {
    role: iamRole.name,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaFullAccess,
});

const onPollChangesQueue = new aws.sqs.Queue("onPollChangesQueue", {
    fifoQueue: true,
    contentBasedDeduplication: true
});

const onChangesForEnvironmentQueue = new aws.sqs.Queue("onChangesForEnvironmentQueue", {
    fifoQueue: true,
    contentBasedDeduplication: true
});

const onChangeForTenantEnvironmentQueue = new aws.sqs.Queue("onChangeForTenantEnvironmentQueue", {
    fifoQueue: true,
    contentBasedDeduplication: true
});

const pollChanges = new aws.lambda.Function("pollChanges", {
    runtime: aws.lambda.Nodejs10dXRuntime,
    role: iamRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../functions/poll-changes/dist"),
    }),
    handler: "index.handler",
    environment: {
        variables: {
            BREEZBOOK_URL_ROOT: process.env.BREEZBOOK_URL_ROOT,
            INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
            ON_CHANGES_FOR_ENVIRONMENT_TOPIC_ID: onChangesForEnvironmentQueue.id,
        }
    },
    events: [
        {
            sqs: {
                arn: onPollChangesQueue.arn,
            },
        },
    ],
});

const handleChangesForOneEnvironment = new aws.lambda.Function("handleChangesForOneEnvironment", {
    runtime: aws.lambda.Nodejs10dXRuntime,
    role: iamRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../functions/handle-changes-for-one-environment/dist"),
    }),
    handler: "index.handler",
    environment: {
        variables: { /* Add necessary environment variables */ },
    },
    events: [
        {
            sqs: {
                arn: onChangesForEnvironmentQueue.arn,
            },
        },
    ],
});