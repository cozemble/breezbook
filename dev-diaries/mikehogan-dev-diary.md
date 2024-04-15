# Sun 14 Apr 2024
Very frustrated to learn that Google Cloud Functions do not honour message ordering when using Pub/Sub.

This is a big issue, because I need to ensure mutations are applied to Airtable (and other 3rd parties)
in the correct order.

So, Inngest can't do it in the infra layer (altho it can get close by pulling it into application code, as 
per [discussion](https://github.com/orgs/inngest/discussions/1256]) ).

Now it seems the last couple of days pivoting to using Google Cloud Functions is also a dead end.

ChatGPT says Google Cloud Run gives my application code control over ack'ing pub/sub events, but if there is 
any concurrency in play, either multiple container instances or concurrency of a single instance, ordering
guarantees are lost.

I really want my infra layer to handle this for me, not my application code.

ChatGPT recommends the following avenues of investigation:

 - Cloud Tasks
 - App Engine
 - Kafka
 - RabbitMQ
 - Use a database to impose order and poll

I guess the core of the issue here is that the dispatcher/broker needs to be aware of the ordering, and dispatch to 
compute accordingly.

A further riff with ChatGPT suggests that AWS Lambda and SQS FIFO queues solve this issue of the broker coordinating 
with compute in a message-ordering-aware manner.  And it suggests that Google does not offer similar.  Azure can pull
this off by using Azure Functions with Service Bus and "sessions"

So I guess we're pivoting my pulumi code to AWS deployment.

# Mon 15 Apr 2024

I woke up this morning realising that I probably can pull off what we need in terms of mutation replication order
while still using Inngest.  This thought was prompted by the [discussion with Darwin](https://github.com/orgs/inngest/discussions/1256]).

If each Inngest event handler call fetches the latest mutation event for its tenant-environment pair, then it can process
that as a retryable step, then mark that mutation event as replicated.  If there is another mutation event waiting for 
the same tenant-environment pair, another step can fire another event to trigger the same handler again.

So this is keeping the mutation events in the database, and replying on that for order, rather than putting them in the
Inngest event payload.  Might be more load on the database, but we can worry about that later.
