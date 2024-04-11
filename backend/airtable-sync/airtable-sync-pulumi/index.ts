import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("hello-world-bucket", {location: "europe-west1"});

const bucketObject = new gcp.storage.BucketObject("hello-world-zip", {
    bucket: bucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../functions/hello-world/dist"),
    }),
});

const helloWorldFunction = new gcp.cloudfunctions.Function("helloWorldFunction", {
    runtime: "nodejs14", // make sure this matches the runtime environment you need
    entryPoint: "helloWorld",
    sourceArchiveBucket: bucket.name,
    sourceArchiveObject: bucketObject.name,
    triggerHttp: true,
    availableMemoryMb: 128,
    region: "europe-west1",
});

const functionIamMemberAllUsers = new gcp.cloudfunctions.FunctionIamMember("functionIamMemberAllUsers", {
    cloudFunction: helloWorldFunction.name,
    role: "roles/cloudfunctions.invoker",
    member: "allUsers",
    region: "europe-west1",
});

export const url = helloWorldFunction.httpsTriggerUrl;
