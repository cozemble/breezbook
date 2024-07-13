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
with compute in a message-ordering-aware manner. And it suggests that Google does not offer similar. Azure can pull
this off by using Azure Functions with Service Bus and "sessions"

So I guess we're pivoting my pulumi code to AWS deployment.

# Mon 15 Apr 2024

I woke up this morning realising that I probably can pull off what we need in terms of mutation replication order
while still using Inngest. This thought was prompted by
the [discussion with Darwin](https://github.com/orgs/inngest/discussions/1256]).

If each Inngest event handler call fetches the latest mutation event for its tenant-environment pair, then it can
process
that as a retryable step, then mark that mutation event as replicated. If there is another mutation event waiting for
the same tenant-environment pair, another step can fire another event to trigger the same handler again.

So this is keeping the mutation events in the database, and replying on that for order, rather than putting them in the
Inngest event payload. Might be more load on the database, but we can worry about that later.

---------------
I have refactored my Inngest code to work with mutation events in the database, and now I want to write an integration
test for it. I discovered `prismock`, which can act as a mock or a stub or PrismaClient. In the stub case, I can
add mutation events to the database and then run my Inngest code to see if it picks them up.

# Tue 16 Apr 2024

We're chatting, Mete and me, about how to model "locations" in our booking app. We didn't add support for them until
now when a gym owner with five locations expressed an interest. What are all the dimensions of concern around locations
in a booking business.

* A business might have one location or many at the time they come to breezbook.
* They might have one location today and add another later.
* Different locations:
    * might have different opening hours
    * might have different services
    * might have different staff
    * might have different prices
    * might have different booking rules
    * might have different branding
    * might have different payment methods
    * might have different booking policies
    * might have different cancellation policies
    * might have different resources
    * might have different coupons, discounts and gifts
    * might have different reviews
    * might have different photos
    * might have different social media links
    * etc etc - so in this case the *location* is the point of business definition.
* Alternatively (and in addition) a business might:
    * offer a standard offering across all locations.
    * and also permit local customisation.
    * In which case, the main point of business definition is the business itself.
* If the business is a franchise model, or if the business chooses, customer databases by location would be
  independent of each other. Example being Specsavers in the UK. When I moved town, I was a new customer at my new
  local branch. Although they did manage some form of data migration, albeit painful. I think it was a phone call
  and manual data re-entry
* A given location might have additional charges. For example, a mobile car wash servicing London would have to
  charge for the congestion charge - but only if it's inside a geo-fence. Or is this a location-specific pricing
  rule?
* This means a booking must have a location - which makes sense, and just shows how shallow our model is given it is
  based thus far solely on the mobile car wash case.
* Which does raise an interesting point. The business might be located at a fixed location, but mobile services would be
  offered at a nominated location. This can be catered for my creating a service-specific extension form, and asking
  for the address.
* And what about virtual offerings? I guess it still makes sense for the business to have a location as an entity, even
  if the service offering does not require one.

---------------
Looks like the new approach with Inngest is working. I need to add some "dx assistance" code to the main app to publish
reference data (services and add-ons) to airtable. After that, bookings create mutation events, which are replicated
in order, in a retriable manner, to airtable. Sweet!!

# Wed 17 Apr 2024

Just looking around at comparable offerings to what we're shooting for. Using perplexity, I searched for
"headless booking/appointmenting systems". Found these:

* https://timerise.io/ - headless, seems like a lovely offering
* https://www.wix.com/studio/developers/headless - Wix Headless
* https://onsched.com - api docs here https://sandbox-api.onsched.com/index.html
* https://www.timekit.io/ - kinda cool that they show curls commands for the stages of a booking

---------------

Starting to implement initial support for "locations" in the model. Supporting specification of business hours at
local level and/or at global level is essential for day one of this feature. Following a chat with Claude, we came up
with this:

Add `location_id` as an optional to all effected tables:

```sql
create table business_hours
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    location_id     text references locations (id),
    day_of_week     varchar(10)                         not null,
    start_time_24hr varchar(10)                         not null,
    end_time_24hr   varchar(10)                         not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);
```

Claude then said this kind of sql would find local and global business hours, with local first.

```sql
SELECT bh.*
FROM business_hours bh
WHERE bh.tenant_id = 'tenant_id_value'
  AND bh.environment_id = 'environment_id_value'
  AND (bh.location_id = 'location_id_value' OR bh.location_id IS NULL)
ORDER BY bh.location_id NULLS LAST;
```

But I want Prisma, and this is what it said:

```typescript
const businessHours = await prisma.businessHours.findMany({
    where: {
        tenant_id: 'tenant_id_value',
        environment_id: 'environment_id_value',
        OR: [
            {location_id: 'location_id_value'},
            {location_id: null},
        ],
    },
    orderBy: {
        location_id: 'desc',
    },
});
```

Nice.

And let's look at resources. Here is the amended table:

```sql
create table resources
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    location_id    text references locations (id),
    resource_type  text references resource_types (id) not null,
    name           text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);
```

Here is how we find all resources that are either global or at location X:

```typescript
const locationId = 'location_X_id';

const resources = await prisma.resources.findMany({
    where: {
        tenant_id: 'tenant_id_value',
        environment_id: 'environment_id_value',
        OR: [
            {location_id: locationId},
            {location_id: null},
        ],
    },
});
```

I'm going add a `location_path` as an `ltree`, so I keep the door open to nested organisational structures in the
future, should that become a need. Actually, an ltree might be a nicer and more general way to handle the above
example of finding all resources, global and local. Global and local is just a two node deep tree. But let's not
go there yet.

Ah bugger - prisma does not support ltree.

# Thu 18 Apr 2024

I added code into the app yesterday to set-up a test tenant when it boots against an empty database. All works fine
when running it using node, and when running the docker image locally, but it fails with:

```
PrismaClientInitializationError: 
Invalid `prisma.tenants.findFirst()` invocation:
Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool (Current connection pool timeout: 10, connection limit: 5)
    at ai.handleRequestError (/app/node_modules/.pnpm/@prisma+client@5.9.1_prisma@5.12.1/node_modules/@prisma/client/runtime/library.js:126:7075)
    at ai.handleAndLogRequestError (/app/node_modules/.pnpm/@prisma+client@5.9.1_prisma@5.12.1/node_modules/@prisma/client/runtime/library.js:126:6109)
    at ai.request (/app/node_modules/.pnpm/@prisma+client@5.9.1_prisma@5.12.1/node_modules/@prisma/client/runtime/library.js:126:5817)
    at async l (/app/node_modules/.pnpm/@prisma+client@5.9.1_prisma@5.12.1/node_modules/@prisma/client/runtime/library.js:131:9709)
    at async setupDevEnvironment (file:///app/dist/esm/dx/setupDevEnvironment.js:9:9) {
  clientVersion: '5.9.1',
  errorCode: undefined
}
```

when the image is run on Google Cloud Run. The env vars seem the same to me. So am now adding a 20 sec delay between the
app booting
and attempting to acquire a pooled connection, to see if that makes a difference. It did not. Neither did
adding `?pgBouncer=true` to the
database connection url. Turning on prisma logging at `info` level revealed nothing. Now adding an endpoint to do the
setup, to see why endpoints work and this auto-setup does not. So when I call the same code in an endpoint, it works
fine.
Going to try calling the endpoint after the app boots, and see if that solves the issue. So calling the endpoint right
after the app
boots also fails with the same error. This time trying to call it using the public endpoint, rather than the internal
one.
That worked. WTF?

# Fri 19 Apr 2024

The work I did a few days ago, adding an optional `location_id` to `services` and other tables, means I can have a
service at global space shared by all locations, or a service at one local space. But I can't have a service at two
of three locations. I think this is a better way to model the domain. So now we're talking about a mapping between
services and locations. So it sounds like a `service_locations` table is calling.

My mind finds it easier to work with examples, so I'm going to model a gym in several locations, offering different
services, some of them global, some of them local, and others in several locations.

In doing this, setting up a multi-location gym model, it became obvious that location needs to be on
`resource_availability`, rather on `resources`. This is because a resource can be available at one location for one
period of time, and at another location for another period of time. So I'm going to move `location_id` to
`resource_availability`.

# Sun 21 Apr 2024

Still working through the multi-location model of a gym, testing as I go. It's fun :)  My tests are against a massive
fixture that models the gym with three locations, which is a bit hard for newcomers to follow, I expect. But the
reason I am pursuing it is that the fixture is prisma code, that uses prismock in my tests, but real prisma when
inserting into the database a test tenant. Is this a sensible trade-off? Let's see how it plays out.

Anyway, first cut of location support done. Here is the fixture that sets up
[a multi-location gym](https://github.com/cozemble/breezbook/blob/9262682c14520974299c2aca0bb4cf706228306e/backend/airtable/src/dx/loadMultiLocationGymTenant.ts#L1)
and here
are [the tests for it](https://github.com/cozemble/breezbook/blob/8accf91e4e909aacc226d1b791d539afba1a8de0/backend/airtable/test/availability/byLocation.spec.ts#L15)

# Mon 22 Apr 2024

Deploying location stuff now.

Had a thought about IDs in this multi-environment infra we've got. Right now, a service has its own `service_id` as a
primary key.
It also has a `tenant_id` and an `environment_id`. Having a `service_id` is kinda nice, because it makes foreign key
management easy.
But if I used a compound key of `tenant_id`,`environment_id` and `service_id`, then it would be really easy to copy data
from environment to environment. There would be no need to worry about tracking primary key re-mapping between services
and locations and orders etc - just change the `environment_id`. It would make testing out data changes in an
environment almost
trivial. And it would make pulling data down from production to a test environment almost trivial. One of those to stew
on.

# Fri 26 Apr 2024

Loaded all the services for the car wash business. There are many services. So it looks like we'll need to provide
some kind of categorisation ability.

# Sat 27 Apr 2024

In terms of onboarding our first customer, I'm writing scripts to import their data from excel files. Do things that
don't scale they say. While I decided that replicating booking data into Airtable was the way to go to give this
client extensibilty in terms of automation of their business, I decided to not implement import of configuration data
from Airtable.

Where this goes ultimately, I'm not sure. I thought my blinding insight was to not make a database this time, to focus
instead on making an excellent booking experience backed by Airtable/SmartSuite etc. I'm continually back and forth on
this. Taking this approach might be nice to get started, but is it something people are looking for? Would
"the shopify of bookings" be a better long term offering? Shopify does everything an ecommerce business could want.
Should breezbook take the same line for booking based businesses?

To be honest, I think the real reason I felt excited about using Airtable was the backend, was that it enabled my client
to set-up Gmail automations, and I am fearful of adding any Google integrations into my apps due to the expense of the
security reviews that are seemingly required to get my app verified. So this is a decision based on fear and
ignorance. I need to find someone who has been down this road before.

I just did a search on perplexity.ai, and it seems that what I fear is the case. I can understand why Google have put
this in place, but gosh it's a pita to get a small side project started.  
[This person](https://www.reddit.com/r/GoogleAppsScript/comments/os2kap/oauth_scope_verification_for_publishing_an_app_to/)
says that unless your product is going to make $25k a year, don't bother.

# Mon 29 Apr 2024

It's time to make my Airtable OAuth Application be a production version. For that, I need a Privacy Policy and Terms of
Service. I asked Claude

_What questions would you ask me if I wanted you to generate a privacy policy for my new booking/appointmenting SaaS?_

and it returned:

1. What types of personal data do you collect from users (e.g., name, email address, phone number, payment information)?
2. How do you collect this personal data (e.g., user registration, booking/appointment forms, third-party integrations)?
3. What is the purpose of collecting this personal data (e.g., providing the service, communication, marketing)?
4. Do you share any personal data with third parties? If so, who are they, and for what purpose?
5. How do you protect the personal data you collect (e.g., encryption, access controls, security measures)?
6. How long do you retain the personal data, and what is your data deletion policy?
7. Do you use cookies or similar tracking technologies on your website/platform? If so, what types of cookies and for
   what purpose?
8. Do you transfer any personal data internationally? If so, to which countries and under what legal mechanisms?
9. How can users access, update, or delete their personal data?
10. How do you handle personal data of minors (if applicable)?
11. How do you communicate changes to your privacy policy to users?
12. What is your process for handling data breaches or security incidents?
13. Are there any industry-specific regulations or compliance requirements that apply to your SaaS (e.g., HIPAA for
    healthcare-related services)?
14. In which jurisdictions do you operate, and are there any specific privacy laws that apply (e.g., GDPR, CCPA)?

So I'm going to turn my privacy policy into a file in github (the benefit of open source) and then link to it from my
website

# Tue 30 Apr 2024

Turning attention to airtable integration again. Nat has provided me the Airtable base and tables that he wants to map
Breebook bookings into. At this stage I feel the need for a tool that does this:

* Connects to an airtable base and inspects the tables
* Connects to my postgres database, and allows me to filter down to source tables, and from there down to source
  records,
  by specifying a filter query (by tenant id and environment id in this case). This might be impractical in the general
  case, but what I'm after is some means of stating what my source record payloads are. Pasting a bunch of exemplar
  payloads into textboxes would also be ok.
* Define my mapping plan and see which source records it selects, and what airtable mutations it emits

I'm going to do this in a unit test for now, which might be the better engineering approach. But I can't help but think
that there is a generic product sitting under this need.

# Wed 1 May 2024

Wow, I still have Inngest concurrency misunderstood. Concurrency applies to steps, not to functions. So if I have
a function with three steps and a concurrency of 1, then I launch 3 instances of the function, Instance 1 step 1 will
run, and Instance 2 and 3 will pause. But then when Instance 1 step 1 finishes, it is not clear to me if Instance 2
step 1 will run, or if Instance 1 step 2 will run.

I have asked [here](https://discord.com/channels/842170679536517141/1235217182137389057)

So my replication steps for airtable replication have a race condition in them. Here are my Inngest steps:

1. I find the next event to replicate,
2. I replicate it to airtable,
3. I record the airtable record id against the source record id, (so subsequent updates can address the
   same record)
4. I mark the event as replicated.

So if I have two instances of the function running, and they both find the same event to replicate, then they will both
replicate it to airtable, and I will end up with two records in airtable.

Even if I mark the event as replicated (or locked) as soon as my function grabs it, I can end up with race conditions.

Let's say the order of events is:

1. upsert customer
2. upsert booking

In function 1 runs and eagerly grabs event 1, then function 2 runs and grabs event 2, then function 1 fails to
send the customer to airtable, function 2 could be scheduled next and send the booking to airtable without the
customer having made it first.

So one option is to put all the work of the function into one step. That is, find the next event, send it to airtable,
record the airtable record id, then mark the event as done. The issue here is that unit of work will be retried as a
whole if any issue happens in it. If an error happens when recording the airtable record id for a create action, and
then the entire unit of work is retried, then the record will be created again in airtable. Not acceptable.

So the next thing I am going to try is to implement a locking mechanism as the first step in the Inngest function.

Here is pseudo code:

```typescript
const inngest = require("inngest");

const replicateEventsFunction = inngest.createFunction(
    {name: "Replicate Events"},
    {tenantId, environmentId},
    async () => {
        const lockKey = `${tenantId}_${environmentId}`;

        // Step 1: Acquire the lock
        await inngest.step("Acquire Lock", async () => {
            const lockAcquired = await acquireLock(lockKey);
            if (!lockAcquired) {
                throw new Error("Failed to acquire lock");
            }
        });

        // Step 2: Find the next event to replicate
        const event = await inngest.step("Find Next Event", async () => {
            return findNextEvent(tenantId, environmentId);
        });

        if (event) {
            // Step 3: Replicate the event to Airtable
            const airtableRecordId = await inngest.step("Replicate to Airtable", async () => {
                return replicateToAirtable(event);
            });

            // Step 4: Record the Airtable record ID against the source record ID
            await inngest.step("Record Airtable ID", async () => {
                await recordAirtableId(event, airtableRecordId);
            });

            // Step 5: Mark the event as replicated
            await inngest.step("Mark Event as Replicated", async () => {
                await markEventAsReplicated(event);
            });
        }

        // Step 6: Release the lock
        await inngest.step("Release Lock", async () => {
            await releaseLock(lockKey);
        });
    }
);
```

And I will use a simple table in postgres to house the lock:

```postgresql
CREATE TABLE locks
(
    lock_key    VARCHAR(255) PRIMARY KEY,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

There may be some down-side to this with Inngests "fair" queueing system. If a function with the lock has a failure,
and there are 20 other functions queued, Inngest will give time to those other 20 functions, not knowing that they are
destined to fail. So it will take some time for a retry to come around to the function with the lock. But I am open to
correction on this.

In any case, this is a theoretical issue, because there will seldom be more than two functions running at a time.

Actually, I could code it so that if a function fails to acquire a lock, it exits early as a success, because the given
tenant-environment combination is being handled.

That seems to work ok-ish. The problem now is when a function acquires the lock, but then fails to complete, the lock
remains. To be honest tho, I think I prefer this, because it stops the line for the given tenant-environment pair,
allowing other pairs to progress. When it comes to fixing replication issues, I prefer a stop-the-line approach.

# Thu 2 May 2024

Some notes I made in the past on airtable replication:

While working on this booking/appointmenting app, I need to get data from it into airtable.
Zapier and make.com can map data from webhooks to airtable tables. And the same can be used to
push changes in airtable back to my app. But I have the following requirements:

1. I do not want to have to maintain mappings between the primary keys in my app (which might be composite)
   and the airtable record ids. I want the integration layer to handle this.
2. I want to be able to setup and change the mappings between my app and airtable using an API
3. I want the mapping definition to be easy to read and understand
4. Pushing from my app to airtable can be done by incremental record building, because airtable has weak data integrity
   rules. So I can build part of an airtable customer record from one table as one push and the remainder from another
   table
   as a second push. But going the other way - from airtable to my app - works differently. If a customer is split
   across
   two tables in airtable, lets say first name and last name come from one table and the customer email and phone number
   come from another table, but all four fields are required in my app, then I want this record merging to happen in
   the integration layer, and I want it to be easy to configure.

Zapier and make.com do not seem to solve this well, and I'm not aware of any existing product that does all of the above
in a way that I like. Whalesync is expensive.

# Fri 3 May 2024

Important mini-lesson today. The replicateEvent step in my Inngest airtable integration converts a breezbook mutation
into one or more airtable mutations. The airtable mutations are then sent to airtable. I had an error just now
about "422 Unprocessable Entity". But because I combined the conversion and the sending into one step, I had no natural
inspection point of what payload I was sending to airtable. So, I'm refactoring now to separate the conversion and the
sending into two steps. I can easily inspect the return value of the conversion step to see what I'm sending to
airtable.

# Sat 4 May 2024

I made a mistake yesterday in extracting the prep of airtable mutation commands as its own step. One of the mappings
from breezbook mutations to airtable mutations, involved a one to many, specifically
[this mapping](https://github.com/cozemble/breezbook/blob/a681501e322cc841eeddde849f1e6a1990529fbb/backend/airtable/src/airtable/natsCarWashAirtableMapping.ts#L120).

This mapping converts an `upsert` on `booking_service_form_values` to a `Car details` airtable record, and updates the
`Bookings` record with new information, and a reference to the `Car details`. You will notice that the `Car details`
reference (from `Bookings`) is a `lookup`.

But of course at the time of planning the mutations, we don't yet know the airtable record of the upserted `Car details`
record, so the lookup will fail. So: when planning the airtable mutations, the `lookup` fields must be left as they are,
and dereferenced only when the airtable record ids are known i.e. at application time.

---------------------------------------

Need to start thinking about getting notified when a replication to airtable message fails. Asked perplexity, and got
this:

Yes, Inngest does indeed offer built-in functionality to handle failures and send notifications, including to Slack,
without requiring you to manually code this into each step of your functions. According to the Inngest documentation,
you can utilize the `inngest/function.failed` event to handle all failed functions in a centralized manner. This
feature allows you to set up notifications to external systems like Slack whenever a function fails.

Here’s how you can set up a function in Inngest to send a Slack notification when a function fails:

1.Create a Slack App and Incoming Webhook:

* First, create a Slack app and enable incoming webhooks to receive notifications. You will get a webhook URL which you
  will use to send messages from Inngest.

2. Set Up the Inngest Function:

* You can define a function in Inngest that triggers on the inngest/function.failed event. This function will execute
  when any of your other functions fail.

3. Configure the Function to Send Notifications to Slack:

* Within this function, you can use the Slack Web API to send a notification to your designated Slack channel. You will
  need to use the webhook URL obtained from Slack.

Here is an example of how you might define this in Inngest:

```javascript
import {client} from "@slack/web-api";

export default inngest.createFunction({
    id: "notify-on-failure",
    name: "Send failure notifications to Slack",
    event: "inngest/function.failed"
}, async ({event, step}) => {
    const slackToken = process.env.SLACK_TOKEN; // Ensure you have set your Slack token in your environment variables
    const channel = "C12345"; // Replace with your Slack channel ID

    const originalEvent = event.data.event;
    const error = event.data.error;

    const slackClient = new client.WebClient(slackToken);
    const result = await slackClient.chat.postMessage({
        channel: channel,
        text: `Function failed: ${originalEvent.name} with error: ${error.message}`
    });

    return result;
});
```

This function listens for the `inngest/function.failed` event and sends a message to a Slack channel with details
about the failure. This setup allows you to centralize error handling and notification, enhancing the operability and
monitoring of your functions without embedding notification logic directly into each function.

# Mon 6 May 2024

Deleted a bunch of database migration scripts that I played around with when trying to find a solution for airtable
migration. I'm continually zapping the "prod" database because we have no users yet. Nice situation, but that will
soon change.

Today's main focus is getting payment confirmation stripe webhooks correctly integrated. What they will need to do
is record the amount paid against the order, and that amount will be replicated to airtable. Then airtable knows the
booking has been paid for, and can send out the confirmation email.

# Tue 7 May 2024

When looking into marking stripe payment against bookings, I rediscovered that a booking comes from an order, and an
order can have many bookings. So I only had an order to associate a payment against. Which is fine, but the issue is
that the unit of replication to airtable is the booking. So, I decided I needed the total cost of a booking to be
recorded against the booking. Which meand changing what comes from the front end in terms of order placement.

We had a CreateOrderRequest that was build just for the needs of placing an order. At the same time, we had
PricedBasket, which supports the UI render line item details on costs. And this is what I now need at the backend. So
I refactored CreateOrderRequest our of the codebase, in favour of using PricedBasket as the means of placing an order.

All that's needed in addition to the PricedBasket is the Customer and the payment method. Actually feels more natural.

And all the existing validations have been ported over to the PricedBasket.

# Wed 8 May 2024

I'm finding myself having to expose more tables into airtable to achieve the behaviours I want in airtable. Two
examples:

1. I find myself having to add "Order lines" to airtable, and replicate the Price of the Order Line to Airtable, so I
   can pull up the total cost of a booking in airtable.
2. This morning I find myself considering having to replicate Orders to Airtable, because the payment method is on the
   order. The payment can be "full payment at point of booking", "payment following delivery of service", and
   "deposit with balance paid following delivery of service". The reason airtable needs this data is to help decide when
   to send the confirmation email. In the case of full payment or deposit-and-balcne, it's when the confirmation from
   stripe comes in. In the case of payment following service, the confirm email goes straight away.

I'd like my replicate engine enable me to hide the fact that there are Orders and Order lines underpinning the bookings.
The folks managing bookings in airtable don't need this noise.

In both cases above, the relevant values from Order Line and Order are airtable lookup fields, i.e. pulled into the
Booking record.

So what crossed my mind is that the replication engine permits the marking of certain tables as "shadow tables", meaning
that the engine maintains their state, and enables the necessary lookups into these shadow tables. The right values
get to airtable, but the noise is hidden.

It is possible to hide tables in airtable, but nevertheless, in the spirit of removing friction, I think we should shoot
for something similar to this "shadow table" concept.

There will be data privacy issues in doing this. Still feels like what I'd like to have though.

# Sat 11 May 2024

I think we have done everything necessary to launch with Nat. There are some UX snags that have to be worked thru, but
all the parts of the system are done. UI, availability, booking, payment, replication to airtable. In airtable,
sending of notification emails.

The plan is to switch one of Nat's services on his website to book thru breezbook, and we'll watch how bookings are
progressing thru the use of Mouseflow, and watch for errors thru the use of Sentry. So I can't think of anything to do
right now :)

What will it be like once this goes live? Watch for the first visit to the booking page. See if it's clear to the
visitor. Iterate on the UX and UI if not. If a booking happens, high five!  Check it replicates correctly to airtable
and the confirmation email goes out. Check with the team that they are comfortable with the data layout in airtable.
In time, switch all of Nat's services over to breezbook.

Then will we need to migrate customers and bookings from his existing booking systems, those being docsndata and acuity?
And retire those systems.

In terms of ops, mouseflow, sentry and inngest error reporting to slack should give us great visibility.

# Fri 17 May 2024

We've been on a bit of a go-slow for the last few days, waiting for Nat to make some decisions and give us the go-ahead
to launch with one of his services.

But today I started playing around with adding a voicebot to breezbook. I initially played with OpenAI text to speech
but then I realised that there is much more than text to speech when it comes to making a voicebot. You need to deal
with interruptions being one major thing. And you need to make sure people don't jail break your prompt and make it
say "breezbook sucks". And you need a neat way to hook it up to phone numbers etc.

So I played around with Vapi.ai. I was initially worried that there would be no flexibility in configuring a voicebot
on the fly for all my tenants. This is because all I saw were low code demos. But thanks to perplexity, I soon realised
that it can totally define voicebots on the fly. You supply a config object.

So I got a POC running with a hard coded prompt, simulating the main points of Nat's car wash in a hard coded manner. It
did really well. There must be a ton of extra prompting that vapi adds, because the agent was saying things that were
not in my prompt. Correct things that a normal person would say. I was impressed.

So now I am making an endpoint that returns this prompt for a given tenant/environment/location tuple, and from that
we're close to having a very nice, custom voicebot for breezbook.

# Fri 24 May 2024

The initial vapi agent shows promise. But the user could be coming to the agent with a number of intents. For example,
they might want to book a car wash, or they might want to know the opening hours, they might want to cancel or
reschedule. I can't put everything needed for all cases into the initial prompt. So I'm investigating how to deal with
conditional conversation flow. I know vapi supports `sendMessage()` and it purports to extend the prompt. But vapi
also supports function calling. So I want to understand if responses from function calls can be prompt extensions or
just data.

Actually working on this, and getting to the point of adding in functions to book slots, made me realise that requiring
only email for customers right now is wrong. I need to make phone number a core customer record component too, and it
needs to identify the customer. So I'm going to make this change now. Which raises an interesting issue. Customers
that originate thru a voice bot will have a phone number, but no email. There is no neat way to get an email address
over the phone when the operator is an LLM powered voice bot. So this turns the whole email-address-identifies-customer
thing on its head. Do I have to make both phone number and email optional? Actually phone number can be acquired thru
both channels, so maybe that's the unique attribute.

Maybe the voicebot never contacts a customer unless they provide their first name, email and phone number in a form to
initiate the call? The database would have a table of `contact_requests` containing this information, optionally
relating to a customer via email address and/or phone number. Right, so the voicebot can expect this information to be
known serverside, and maybe even some of it (first name) is in the prompt.

# Sat 25 May 2024

My docker image for google cloud run that represents pretty much all of my backend has blown up from about 230MB to
830MB. On a bit of a trip to learn why. bundlephobia does not show anything massive in terms of included packages.
Although body-parser is larger than I realised. So I am not running `du -sk` commands inside the image itself. And
learning lots:

1. The `.bin` folder in node_modules is there. Pretty sure I don't need that.
2. The .pnpm directory is there, and it's huge. Given that the app is installed and compiled and ready to run at this
   stage, I think I can delete it. Same for `.modules.yaml`. Except of course that .pnpm is where the actual packages
   are
   and node_modules just soft links to them. So I can't delete it.

So it looks like `inngest` is indirectly pulling in:

```postgresql
99904 aws-sdk@2.1628.0
104520 next@14.2.3_react-dom@18.3.1_react@18.3.1__react@18.3.1
128316 @next+swc-linux-x64-gnu@14.2.3
153196 @next+swc-linux-x64-musl@14.2.3
```

Now I'm going to try using `esbuild` to bundle the index.js for me, because it will tree shake the unused code.

This is proving to be a bit of a pain in the ass, as Prisma requires native binaries to work. Now fiddling around with
copying those into the right place in my Dockerfile. This might prove brittle. But in any case, the docker image size
is now about 16MB.

# Mon 27 May 2024

Nat is being slow about making changes on his side to launch breez on his site, so I'm doing work to help our contact
in Oz see what breez can do for his multi-location gym. Yesterday I added an endpoint to list resources by resource
type, and added images and markup to resources. This is because gym bookings typically start by choosing a personal
trainer first. I realised this morning that this endpoint needs to be location sensitive too, so will fix that asap.
Then the plan is to make a rudimentary user interface to prove that the mechanics work. Then myself and Mete can plan
how to roll this kind of booking experience into breez, as a booking-journey-type choice that users have.

# Tue 28 May 2024

I asked the IntelliJ AI to convert the prisma create code we have to create the test tenants, into upsert code, because
I want the definition of the test tenants to change, as the app and database changes. It did a terrible job, so I'm
doing it manually. In the process, I am willing in the definition of the `mutation` types for each of the database
tables. This will come in handy when we start doing the admin functions and endpoints.

What I realised in doing this is that must mutations are fully specified by their create clause. Usually the update
part is the create clause minus the primary key. And the where clause is the primary key. Two little helper functions,
`omit` and `pick` make this simple. So making the code a bit more compact during this process.

I'm changing the multi-location gym tenant into upsert code first. Once that is done, I will change the app boot
sequence to always attempt to make this upsert. This will get personal trainer images and markup into the database, so
we can start work on the new booking sequence - that being:

1. Pick the resource (a personal trainer)
2. See their individual availability
3. Choose a data and time
4. Make the booking, tying that resource to the booking

Hmm, these mutations of mine have been living a charmed existence. All those used so far have a single field primary
key, called `id`. Now when it comes to modelling `resource_images` as a mutation, it has a composite primary key, of
fields `resource_id` and `context`. I can think of two options:

1. Change this (and all tables) to always have a single field primary key
2. Change my modelling of keys in mutations to support composites

If my airtable integration code, which is based on mutations, is to be most generic and useful, then supporting
composite keys is the first one to try. So going to check-in and explore that option.

## The value of making my docker containers smaller

Some days back I spend a lot of time paring down the size of my docker files, by using `esbuild` to bundle my code, and
by removing unnecessary files from the image. I did this because I was surprised to see the size of the image had blown
out to 830MB. I got it down to 16MB. Now:

1. Builds are faster
2. Pushes to the registry are faster
3. Deployment on Cloud Run takes only a couple of seconds

# Wed 29 May 2024

Entity id handling in airtable replication is based on composite keys, in terms of source records (breezbook) and
destination airtable records, even though airtable record ids are single values. This is just the more generic
approach to replication

# Fri 31 May 2024

I'm on a plane trying to test drive my way to a uniform code structure to get availability for the following cases:

1. Booking against time slots with fungible resources - i.e. a car wash in London with any van
2. Booking against time slots with non-fungible resources - a named doctor doing a home visit at a specific time slot
3. Booking from a list of start times with fungible resources - i.e. a drop in car wash at 10am with anyone who is
   available
4. Booking from a list of start times with non-fungible resources - i.e. 10am personal training session with PT Mike

Any because I have only case 1 before, the code and supporting types are very much shaped by that. Requires a bit of an
exploration. Might be that doing it on a plane is not ideal.

Let's see if I can start by naming the types in the above cases. Actually, are these cases exhaustive? They are a
combination of StartTimeAbstraction & ResourceAllocation. And maybe the general case is that a StartTime might need
more than one resource allocated. The resource requirement would be specified by the Service. So maybe the abstraction
is StartTime & ResourceAllocation[] & Service.

The specification of a Fungible resource is simply the resource type i.e. pick any one resource of the given type.
A NonFungible resource is a resource id - a specific personal trainer for example. A Start Time is either a Timeslot or
a time of day, like 09:15. And a Service is a service.

I think some options for the name of this type, given that it expresses when a given service can be provided, and how it
can be resourced are:

1. ServiceStartTime
2. ServiceStartOption
3. AvailableSlot

Lets go with AvailableSlot

---------------------------

Several hours later, this is going surprisingly well. I think not having internet might be the reason. I understand
the problem domain, and I just got on with writing tests, writing code, refactoring, thinking. If I had the net, I'd
be asking ChatGPT for ideas, and I'd be getting notifications, leading to distraction.

# Mon 3 Jun 2024

For the last few days, I've been the exact opposite of [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)
, which was a bit of a mantra for me here-to-fore. I've been test driving availability logic for as many different
scenarios as I can think of:

1. Purely digital servicw with no resource contraints
2. Mobile car wash with fungible resources
3. Fixed location car was with fungible resources
4. Gym with non-fungible resource i.e. booking with a particular personal trainer
5. Scenarios that require a time slot and scenarios that can happen any time of day
6. Scenarios that require more than one resource

I am going to extend this list with the following:

1. Dog walker that can take 6 dogs at 08.30
2. Yoga class that can take up to 12 people at 18.00
3. Hair salon booking, where the service is configurable from a pick list of sub-services that contribute time and
   price, like

3.1 Haircut
3.2 Haircut and blow dry
3.3 High lights
3.4 Colouring
3.5 Perm
3.6 Hair treatment

# Tue 4 Jun 2024

Realised this morning that putting `capacity` on `resource` is the wrong place. It should be on the
`ResourceDayAvailability`, because capacity changes with time. A dog walker might add or remove resource at any time,
and a mobile car wash might add and remove a van at any time. A yoga class might be able to take 12 people at 18.00,
but only 6 at 08.30. So I'm going to move `capacity` to `ResourceDayAvailability`.

----------------

Extending my availability logic to deal with more cases, seems to cause me to quite frequently replace a simple value
with that value wrapped in context. Examples:

1. ResourceDayAvailability got a capacity field added
2. Calculating availability took a service id, but now services can have options added, so the service id is now wrapped
   in a ServiceRequest object, that also carries the ids of the service options. It will also eventually carry the
   requested add-ons and their quantities, I suspect
3. Bookings have a service id, and from that the duration was implied. But now services can have variable duration,
   so Booking will carry its duration explicitly.

# Wed 5 Jun 2024

Working on the domain logic, yesterday I added a `ServiceRequest` type, that wrapped a plain `serviceId`, and added more
context like the service options and add-ons. But I specified the service and options and add-ons using ids. The
domain logic works better with the full objects, not the ids. I guess I am of a mind to use ids because some part of my
mind is thinking about the HTTP endpoints that are eventually going to front this logic. So I think I need to resist
this temptation, and see what happens to by business logic when it has full objects to deal with.

## Support for services that are "classes"

I worked into a test case of a yoga studio with two instructors and two rooms. I tried to show that if one of the rooms
was full, the booking I was trying to make was impossible. But the availability logic found _a_ room available, so was
happy to proceed. So what I need is to check availability against a particular instructor and a particular room. There
is a domain concept called "class" in this case, a yoga class. I would model a class more generally as a resource
group.

Might a yoga studio now be a bit different to resourcing that I have done here to fore. The car wash and delivery
companies work to time slots. Personal training tries to fill the day. But a third type of resourcing is a published
time table. These would be basically pre-allocated non-fungible resources to a service. I think I can model this
without too much compromise with what I currently have.

1. We have two instructors and a large room and a small room
2. We can have two yoga sessions at 18.00, one in the large room, one in the small room
3. These could be modelled as two services, with assigned rooms and instructors.  
   (Careful, what about changes thru time)
4. One service would be called Asthanga yoga with Mike and the other Hatha yoga with Mete
5. Suggests by the way that either services need to have a start and end date, or there is a missing concept, because
   when the instructor changes, the service will have to be re-resourced, and renamed, which will affect past bookings
   linked to the service
6. So with these two named services, I can book one or the other.
7. How do I fix the start time to 18.00? All the resources involved will have resource availability of "all day"

There does seem to be at least three ways to express times available:

1. Time slots. Good for mobile services (doctor visit, mobile car wash and dog treatments, deliveries). We can be there
   between 9am and 11am
2. Any time of day, or sections of the day, and the booker chooses. What's a good name for this? ChatGPT suggests
   'Flexible Scheduling'
3. Timetable. A service might be available at 9am, 13.00 and 17.00. A particular yoga session for example.

If a service has time slots, then 1 and 3 are the same? The fact that `Service` as the boolean `requiresTimeslot`
suggests that maybe this is true. Drop this boolean and add an optional array of `TimeSlot` to `Service` and we're
good?

So, concluding: services to have optional time slots, and the ability to express a need for one or more fungible and
non-fungible resources. Also, services to have start and end dates (or versions?) to handle changes over time.

This way, and service that starts at 18.00 that requires Mike and the Small Room, is "Yoga with Mike in the Small Room"

## Enjoying modelling this domain

I got to say, I'm very engrossed and thoroughly enjoying modelling this domain. I'm adding explicit resource
requirements to services now - supporting any resource or a given type, or a given resource. Going through the code and
patching this up, writing tests for new behaviour, it really feels like I'm "working the code" and it's coming into a
better shape. I'm enjoying it because its just domain classes and logic, disconnected from databases and http. I can go
fast and explore the domain cheaply this way. Data objects are becoming more coherent in their contents, and better
named. Functions are going into the right place. It's starting to feel stable.

# Thu 6 Jun 2024

It seems to me that I am working with at least three different kinds of "model" in this work of modelling the domain of
bookings and appointments:

1. The business logic model - fully hydrated in-memory objects, with all the context they need to do their job, and a
   suite of functions to carry out the business logic like checking availability, making bookings, etc.
2. The database model - the tables and relationships that are needed to store the configuration and user data
3. The configuration model - how the business logic model is expressed by the user. For example, a business logic
   model of `Service` has the possible start times in it. But expressing how a business thinks of start times is not by
   listing start times on each service. They may say that booking options begin on the hour, or on the half hour. They
   might list explicit blocks of time. They may express a series of time slots. So the configuration model is the medium
   in which the rules of the business are expressed. These are stored in the database as different models. And they are
   converted into business logic models when the business logic needs them.

## one instructor and many people in a room

Consider this setup:

```typescript
const room = resourceType("room", true);
const instructor = resourceType("instructor");
const smallRoom = resource(room, "Small Room");
const mikeInstructor = resource(instructor, "Mike");
const requiredResources = [
    resourceDayAvailability(smallRoom, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)), capacity(10))]),
    resourceDayAvailability(mikeInstructor, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
];
const theService = service("Yoga with Mike in the Small Room", "Yoga with Mike in the Small Room", [specificResource(smallRoom), specificResource(mikeInstructor)], 60, price(3500, currencies.GBP), [], []);
const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(smallRoom.id, capacity(1)), resourceAssignment(mikeInstructor.id)], "confirmed");
```

The intention here is to permit 10 bookings of Yoga with Mike in the Small Room at 09.00. But the current code counts
out `specificResource(mikeInstructor)` following the first booking.  
The intention is not well expressed or modelled. This idea is that the capacity of the small room "transfers" magically
to Mike being associated with it.

I can't just say that if a any resource requirement has a capacity, then it transfers to the entire list of resource
requirements.  
Imagine if there was an instructor, a room that can take 10 people, and only 6 pilates machines. The aggregate capacity
would be 6, not 10.

Is this the general rule? If there is capacity involved, the capacity of the group is the min of all capacities?

I can't help think there is a better way to express this.

## Claude suggests moving the capacity to the service

And I think it is right. I asked it to check my dev diary to see what I modelled capacity on resource, and if there is
anything I would lose
by moving it to service. It could see no reason. Indeed it found reasons in my diary that make modelling capacity on
service as probably
more sensible. It also pointed out that while the capacity of `Small room` might be 10, for a given service - one that
uses lots of equipment for example -
the capacity might be less. Am sold. Refactor here we come.

## Maintaining the right energy level for clean refactoring

You know I do feel that moving capacity to service is the right design move. But so much has gone into modeling capacity
on the resource
that it's a medium sized task. The fact that I did this work yesterday and they day before, makes me feel tired about
taking this new work
on. If I do not enter this refactor with the right energy and enthusiasm, I will will be looking for short-cuts. Having
the right
energy is a super important part of clean refactoring. So I'm going to take a break and come back to when I don't feel
attached to
what I did yesterday.

# Fri 7 Jun 2024

Starting on this refactor to shift capacity from resource to service. I think I found a bug, permitted to exist due to
the fact
that none of my tests have a scenario involving bookings with different service durations. My code is using the duration
of the
required service to calculate the end time of the booking. So rolled back my refactor effort to do the following:

1. Add a full `Service` instance to `Booking` instead of `serviceId`
2. Replacing `slot` on `Booking` with a start time and end time, because this Booking model is to calculate
   availability, not to
   store or request bookings. The end time is calculated from the start time and the duration of the service.

## Sometimes the current solution is one case of a more general case

Case in point being the addition of capacity. It seemed like I had to add a new thing to the model, but in fact, the
current model
was based on every service having a capacity of 1. When I first added capacity, I added special if statements to the
current code
to check if capacity was involved. But later I realised that the current code, with capacity set to 1, satisifed the
current
need of resource availability dropping out if a booking was made by subtracting booking capacity (also implicitly 1)
from
remaining capacity.

# Sun 9 Jun 2024

shifting tack - trying to see if I can test drive out resourcing bookings in a given time period, as means of checking
availability
in a given timeslot. The idea being that I can pass each candidate time period to this function, saying: please resource
all
bookings in this period, and let me know what resource remains. Then I'll see if there is enough for the service I am
checking
availability of.

## Confusing modelling of resource assignment to bookings

Some time back I introduced an array of allocated resources to `Booking`. I know the intention behind this decision was
to record
bookings that have been made against a hard resource assignment. For example, a personal training session with an
individual named
personal trainer. This contrasts with a booking against any van of a pool of vans that can drive out and deliver a
mobile car wash
service.

The confusion I am experiencing now is that my logic for calculating availability for a given time slot, is to first try
to allocated
resources to all existing bookings, then see if there is sufficient remaining resource to satisfy the given service.

So some resources on some bookings are predefined. And other resources on some bookings are assigned during availability
checking.

This distinction is not obvious.

I think I need to make it clear that resource assignments in `Bookings` are something
like `specificResourceAssignments`. And to help
clarify that, I can make these contain the `SpecificResource` that they originated from. Actually, that will not work.
Because the
`assignedResources` on `Booking` were intended to record how many of a given resource were consumed by the booking i.e.
how much capacity
of the given resource was consumed by the booking.

Now that capacity is moving from `Resource` to `Service`, similarly booked capacity must move from `ResourceAssignment`
to the `Booking`
itself.

Oh gosh, even more confusion in the statement above. Recording a list of `SpecificResource` requirements against the
booking is
redunant, because the list of `SpecificResource` requirements is already on the `Service` and the `Booking` has a
reference to the
service. So I can drop this `resourceAssignment` field on Booking.

## Finally have capacity modeled on service

Capacity is now modeled on service. And booked capacity is modeled on booking. And resource usage is based on booked
capacity.
Oh, that means that reporting availability should also be capacity based. A slot might be reported as available, with
capacity of 1
and the customer might be intending to book 2. But I think I will leave that refactor for another day.

The final step is to remove all concepts of `capacity` that are still on `Resource` and `ResourceType`.

# Mon 10 Jun 2024

I removed the tests that "showed" how we could check availability of personal training against a single personal
trainer.
The implementation reduced the available resources to just the required personal trainer, and then ran the usual algo.
This approach makes it impossible to book a personal trainer AND some other resource. In which case my mind thought
of just replacing all personal trainers in the available resources list with the personal trainer requested. This makes
it impossible to ever request a booking with two named personal trainers. While an example of such a case does not
readily
present itself, it it still a limit I would like to avoid coding into the solution. Maybe a particular medical
appointment
requires two named doctors, who knows. So booking against a single resource is not well implemented by reducing the list
of available resources.

So it might be better, I thought this morning, to take advantage of the fact that we have a business logic model, and
separate
database and configuration models. In the latter two, it can make sense for resource requirements to be expressed at the
service level. In fact it definitely makes sense that a service can state that it requires a personal trainer and a
training
room. If we expressed resource requirements differently in the business logic model, by putting the resource
requirements
on the `ServiceRequest` rather than the `Service`, this positions us to make service requests with different kinds of
resource requirements.

The `Service` in the database model can be configured to require any personal trainer and any training
room, and that is entirely appropriate. To retain current behaviour, the resource requirements on the service that comes
from the database will be copied into the `ServiceRequest`. This is logically equivalent to resource requirements being
on the business logic `Service`. But then it opens the door to later cases of the service request overriding the request
of any personal trainer to a particular personal trainer.

Now, to deal with the hypothetical case of requesting two specific personal trainers or doctors, the resource
requirement
should have an id, or maybe a `role` attribute, so we can be precise about which requirement we are specifying a
specific
resource for.

This will be a fairly large refactoring. Oh wow - is it even required? If I add an id or role to a resource requirement,
then the existing resource requirements on the business logic `Service` model can be configured in any way, and I don't
need to mess with the `ServiceRequest` object. I think my mind didn't go here initially this morning, because I am still
viewing business logic `Service` as a database or configuration object, and in some way immutable. I can of course
configure
this with the exact requirements the use case needs.

I think I can drive this out by making a series of test cases around the resourcing of two doctors for an appointment.
The possible resource requirement expressions would be:

1. Any doctor for both slots - has to be a different doctor, so test what happens when there is only one doctor
2. One specific doctor, and one random doctor. Again, has to be different.
3. Specific doctors for both slots

## Rediscovering the need for resource allocation on booking

Just now I changed a design interpretation around resources on service. That being, that resource requirements on
Service
are particular to the request for availability. But previously I said, and designed around, the idea that resource
requirements
on the service were fixed, containing requests for any suitable resource in some cases, and specific resources in
others.
I built on this design decision that idea that bookings did not need to keep their resource allocation, because it
existed
on the bookings service. I have now broken that design rule. So I need to return resourceAllocations to Booking. I think
though, that I only need to stick `SpecificResource` on the booking, because requirements for any suitable resource can
still
be satisfied dynamically during availability checking.

# Tue 11 Jun 2024

I think I have quite good coverage of availability scenarios at this stage. What I learned here will affect how pricing
and booking
is done. For example, a booking can have service options now. It can also have fixed resources, for cases where I am
booking a
personal training session with an individual trainer.

I went deep on availability and resourcing and scheduling. Now I need to balance that a bit by going wide in terms of
end to end
scenarios. I want to test drive out that understanding at the endpoint level. To make the endpoints more testable tho,
I'm
of the mind that I need to shift away from `express` request and response objects, to `http4t`. It makes much more sense
to just treat http requests and responses as objects. And I want to follow the spirit of _server as function_, so
dependencies
will be provided as a function param.

## The importance of great developer experience

Maybe a bit of a nothing statement, but if you plan to work on a codebase for a long time, as I do with this one, its
essential
to keep the developer experience high. The codebase should, over time, become increasingly fun to work with, and
increasingly
intuitive. Refactoring the endpoints so they are based on `http4t` is a case in point. No benefit to the end user, but a
big
benefit to the developer.

## Attracting people to breezbook

I potentially fun way to attract people to breezbook is to provide a zero-auth playground for people to quickly
configure the
essence of their business and see how it would look on breezbook. Some options might be:

Ask "do you have an existing website"
If Yes: Get colours, company name, tag line, logo, services and prices.

If No: Ask for company name and tag line. Infer business and correct. Purposes services and correct. Propose resources
and correct.
Propose add-ons and correct. Propose availability type and correct. Leave locations out, but make obvious it's possible.
Same
for other sidelined features.

Visitors see:

- booking journey
- website

Visitors can configure:

- colours
- font
- logo assistant

Configuration endures thru sign up and accelerates start.

# Wed 12 Jun 2024

Am test driving the end to end flow of booking a personal training session with a chosen personal trainer. I have listed
the personal trainers, so I can imagine the user choosing one. The next thing they will do is check availability of
personal
training sessions with that trainer. I already have an availability checking endpoint. Is this kind of availability
check -
one in which one of the resources is fixed - a new kind of availability check, or the existing availability check with
some
query params.

The general case, is to have a service that requires N resources, some of which might be fixed by the service, some of
which
might be "any suitable resource". The general case is that in the availability check, I can specify one or more
resources
to be overridden.

But how to do that unambiguously? My imaginary example of two doctors being required for a medical appointment - how can
I say
that I want to be specific about one of them, but not the other? When I went through this in the availability check, I
added
an id to each resource requirement, so I could be precise about overrides:

```typescript
serviceFns.replaceRequirement(theService, anySuitableResource(doctor, lead), specificResource(doctorMike, lead))
```

Am I going to expect the frontend to know the id of the resource requirement, and state the necessary replacement? Maybe
that is
ok actually. In an availability check request, the frontend can provide overrides for any resource requirement. Let's
see how that
feels.

## Some hours later

It's going kind of ok. I am test driving out the endpoint calls the frontend will make. But I can't help but think about
how it will
know that this service (personal training) can have this resource requirement (personal trainer) overridden. What I mean
by that
is when the frontend loads the tenant's services, how can it tell that it is legitimate to present a resource-first
booking journey
for this service? When booking a mobile car wash, which is resourced by vans, the user does not expect to pick the van
first.
But when personal training, the user will want to be able to pick the trainer first. They might _also_ want a route thru
the app
to pick a date first and from there any old trainer. But in the case or personal training (or a hair styling, or massage
of tutoring
or yoga) the user will want the person-first option somewhere in the app.

Maybe this is the important distinction - this resource type is a human, and when humans are one of the resources behind
a service,
the frontend can generically present both booking journeys.

This is making me consider adding an `isHuman` flag to `ResourceType`. Is this mental? Maybe not. Going back to my
hypothetical
case of two doctors for a medical appointment, the frontend will need to know that it can present a person-first booking
journey,
even for both doctors. So a service that requires N human resources, can have a person-first booking journey, picking
each person
in turn.

I think more generically tho, that modelling a booking journey as a series of resource selections is a better idea. If a
service requires
N resources, then we might be better off configuring the booking journey as a series of 0 to N resource selections.  
i.e. Pick doctor 1, Pick doctor 2, Pick venue. Some other examples:

- Equiment rental: Pick equipment, pick delivery time, pick delivery address
- Venue booking: Pick venue, pick date, pick time
- Vehicle Rental: Pick location, Pick vehicle, pick time

Maybe this booking journey configuration can be specified just using a list of the involved resource requirements?

# Thu 13 Jun 2024

Couple of thoughts this morning. I was up in friend's last night with Da, and a lady was talking about booking dogs into
a dog
kennel. They had a minimum of 3 days booking. It made me realise that bookings are modeled using a single date. So I
think
I need to loosen that to be a booking has a start date and an end date. This will allow for bookings that span multiple
days.

It also made me realise that some booking journeys can begin with capture of a capacity amount. How many dogs or cats
are you
booking in? Maybe there is a group booking for yoga. So I will add this journey type to Figma for Mete to think about.
So this
means the availability checking function should return how much capacity is available at each slot. Right now, I am
throwing
away that information, and just returning a list of times. I think I need to return a list of times, each with a
capacity.

This opened up the general topic of implicit cardinalities of '1' that can or should, in the general case, be 'N'. For
example,
the number of days in a booking. I began to muse on whether a booking should indeed have one more 'bookings'. Why just
one?
Sometimes such thinking can go too far, but its still no harm in musing. I began to wander into thinking about group
bookings
and repeat bookings. I think I will leave this for now, tho, because the thinking was muddled. But at least it has
started.

# Sun 16 Jun 2024

Consider this helper function in a test case:

```typescript
function orderForService(customer: Customer, service: Service, location: LocationId, startTime: TwentyFourHourClockTime, serviceFormData: unknown[] = [], addOns: HydratedAddOn[] = []): EverythingToCreateOrder {
    const basket = hydratedBasket([
        hydratedBasketLine(service, location, addOns, service.price, service.price, today, startTime, serviceFormData),
    ])
    return everythingToCreateOrder(basket, customer, fullPaymentOnCheckout());
}

export function hydratedBasket(lines: HydratedBasketLine[], coupon?: Coupon, discount?: Price, total?: Price): HydratedBasket {
    const actualTotal = total ?? priceFns.sum(lines.map((l) => l.total));
    return {
        _type: 'hydrated.basket',
        lines,
        coupon,
        discount,
        total: actualTotal
    };
}
```

In the test suite, I want to exercise configurations of basket with many of these values having different values.
There is quite a big combination space in these functions. Right now I am trying to create a basket line where the date
is not today, but four days from now. But you can see also that sometimes I want the total to be wrong, so I can test
that
we validate that. I want a line with a coupon and discount, and sometimes the discount should be wrong, and sometimes
the
coupon should be expired.

What is a nice generic programming pattern for this?

Both Claude and ChatGPT suggest that I should be using a builder pattern. Which would work, but it involves a lot of
boilerplate.

Am interested in considering this approach:

```typescript
type HydratedBasketOption = (basket: HydratedBasket) => HydratedBasket;
type HydratedBasketLineOption = (line: HydratedBasketLine) => HydratedBasketLine;
type EverythingToCreateOrderOption = (order: EverythingToCreateOrder) => EverythingToCreateOrder;

interface HydratedBasketOverrides {
    basket: HydratedBasketOption[];
    lines: HydratedBasketLineOption[][];
}

interface EverythingToCreateOrderOverrides {
    everything: EverythingToCreateOrderOption[];
    basket: HydratedBasketOverrides[];
}

const withCustomer = (customer: Customer): EverythingToCreateOrderOption => (everything) => {
    return {...everything, customer};
}

function overrides(everything: EverythingToCreateOrderOption[], basket: HydratedBasketOverrides[] = []): EverythingToCreateOrderOverrides {
    return {everything, basket};
}

function orderForService(service: Service, location: LocationId, startTime: TwentyFourHourClockTime, overrides: EverythingToCreateOrderOverrides): EverythingToCreateOrder {
    const basket = hydratedBasket([
        hydratedBasketLine(service, location, [], service.price, service.price, today, startTime, [goodServiceFormData])
    ])
    return overrides.everything.reduce((acc, f) => f(acc), everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout()));
}

test('tenant has a customer form, and the customer does not have a form response', () => {
    const theCustomer = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
    const order = orderForService(smallCarWash, london, carwash.nineToOne.slot.from, overrides([withCustomer(theCustomer)]));

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
});

```

That actually proved hard to read, and a bit annoying. I asked Claude about zippers and lenses, and we ended up with
this to try:

```typescript
import {Lens} from 'monocle-ts';

type Mutation<T> = (value: T) => T;

function updateEverythingToCreateOrder(
    mutations: [Lens<EverythingToCreateOrder, any>, Mutation<any>][]
): (order: EverythingToCreateOrder) => EverythingToCreateOrder {
    return (order: EverythingToCreateOrder) => {
        return mutations.reduce((acc, [lens, mutation]) => {
            return lens.modify(mutation)(acc);
        }, order);
    };
}

test('update multiple parts of EverythingToCreateOrder using a generic function', () => {
    const order: EverythingToCreateOrder = {
        _type: 'everything.to.create.order',
        basket: {
            lines: [
                hydratedBasketLine(smallCarWash, london, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, []),
                hydratedBasketLine(smallCarWash, london, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, []),
            ],
            total: priceFns.sum([smallCarWash.price, smallCarWash.price]),
        },
        customer: goodCustomer,
        paymentIntent: fullPaymentOnCheckout(),
    };

    const newTotal = price(1500, 'GBP');
    const newCustomerName = 'John Doe';

    const lineToUpdate = 0;
    const pathToLineTotal = basketLens.compose(linesLens).compose(lineLens(lineToUpdate)).compose(totalLens);
    const pathToCustomerName = Lens.fromPath<EverythingToCreateOrder>()(['customer', 'name']);

    const updatedOrder = updateEverythingToCreateOrder([
        [pathToLineTotal, () => newTotal],
        [pathToCustomerName, () => newCustomerName],
    ])(order);

    expect(updatedOrder.basket.lines[0].total).toEqual(newTotal);
    expect(updatedOrder.customer.name).toEqual(newCustomerName);
});
```

I need to get back working code tho before I try this, so I will plough along with the sub-optional pattern I have now.

## The result of the above

Actually writing simple setter() functions to make the required mutations to a default test object worked out clean
enough
and was not too onerous to work. I suspect I was seduced by the fancier idea of lenses and zippers because I was getting
tired or bored. I think I will stick with the simple pattern for now.

# Mon 17 Jun 2024

I have an end to end test that exercises endpoints and proves to a good level of certainty that booking a personal
training
session with a chosen personal trainer is supported by the system.

I'm trying to think what is the next most useful thing to do. Mete is working on figma designs for the various booking
journeys
we think we'll have to support. I feel the desire to make really simple svelte journeys to prove for sure that I can
support
personal training booking, and the other journeys we have in mind.

# Wed 19 Jun 2024

Had some thoughts about timezones this morning. The principle thought being that I need to do them soon. I think
locations
should have a timezone. Availability check requests can have an optional timezone. Availability checking logic can
operate
using the location's timezone, then convert available slots to the desired timezone. Similarly, when pricing baskets and
making orders, the incoming requests should have a timezone and a similar conversion can be done.

I need to work hard to keep core logic unaware of timezone, just continuing to deal in `IsoDate`
and `TwentyFourHourClockTime`.
The funnelling into and out of timezones should be done outsize the core logic, so I can reduce the number of concerns
in
the core logic.

Good test scenarios for this are:

- Booking from Zambia to London on on March 30th, 31st and April 1st
- Booking from London to Zambia on March 30th, 31st and April 1st
- Booking from New York to Los Angeles
- Booking from Auckland to Apia, crossing the date line.
- Booking from Apia to Auckland, crossing the date line in the opposite direction.

# Fri 21 Jun 2024

Got the playground personal trainer booking experience done. It proves that the endpoints support this journey type.
Interestingly, when I make a few bookings with the same PT, subsequent availability checks fail when applying resources
to bookings, saying "unable to find resource for booking". That is tomorrow's problem. But just goes to show that
the playground, where I can run thru scenarios in an accelerated way, is a useful way to drive the app.

# Sat 22 Jun 2024

Add location selection to the playground personal training booking journey. It revealed a need to treat cases where
the required service is not available at the chosen location. Fixed that.

## The desire for resource based pricing

I pasted all my upserts for the multi-location gym into claude and asked it how it would amend the code to deal with
resource based pricing. It suggested adding a pricing override to resource for each service id. I asked it if there
was maybe a more general feature implied by this resource specific pricing, having learned, hopefully, from putting
capacity on resource initially, then finding it belonged on service. Claude generated some interesting code around a
pricing
ending and pricing factors. Am going to play with that now to see how it works.

It seems to work, but I'm struggling to think in the way it thinks, in terms of how it modelled the rules I mean. It
also
isn't a model that can be serialised and deserialised easily. But I'm going to use it as inspiration. Here is what
Claude
produced - https://github.com/cozemble/breezbook/blob/71605a0d264aa83455d7b051a110eec1b3e09424/packages/core/test/pricing/exploringWhatClaudeCreated.spec.ts#L1

# Sun 23 Jun 2024

I've played with how Claude modeled pricing rules, and I like it. The core idea is to extract what it initially called a
`PricingFactor`, but which I have renamed as `PricingAttribute`. This flattens the domain model into a list of
attributes
that are germane to pricing. It makes the pricing rules and the pricing logic more explicit coherent. And reusable.

For example, some of the attributes

- numberOfDaysToBooking, which enables the pricing that Nat wants. More expensive today, cheaper tomorrow
- bookingStartTime, which enables more expensive peak times
- groupSize, which enables group discounts
- totalOrder, which enables discounts for large orders
- customerLifeTimeValue, which enables discounts for loyal customers
- resourceTier, which enables different pricing for different resources

etc

I realised that this concept of flattening the domain model into attributes that are germain to a given concern can also
be applied
to the refund policy rules. numberOfDaysToBooking, or numberOfHoursToBooking would probably be the core of most refund
rules.
It certainly is for Nat.

I further realised that this "attribute-ification" of the pricing rules opens the door to supply of attributes outside
the domain
model. For example, weather conditions. This in turn opens the door to a companion service creating offers to entice
more
bookings. For example, a customer books a mobile car wash at a certain post code next Monday at 9am to 11am. We could
create custom offers for customers nearby, offering a discount if they get their car washed from 11am onwards. This
external
service would add an attribute to the targeted customers, which would be supplied to the pricing engine, and thereby the
discount actualised.

What other kinds of offers might be possible? If a loyal customer has not booked in a while, and business is slack, we
could
offer them a discount.

It made me wonder if the mission, and the USP of Breezbook, should not be to maximise revenue for the business by
keeping the
calendar full. This goes beyond the mission of traditional booking systems, which is just to take and manage bookings
and
calendars. That is just an operational concern. The problem that businesses want solved is to maximise revenue. This is
a
problem that Breezbook could take on.

Potential Mission for Breezbook:
"To empower businesses to maximize revenue by optimizing bookings, pricing, and customer engagement."

This is what Claude had to say about it:

```
Let's explore this idea further:

Expanded Mission for Breezbook:
"To empower businesses to maximize revenue by optimizing bookings, pricing, and customer engagement."
Key Differentiators:

Intelligent Pricing: Dynamic pricing based on multiple factors (time, demand, customer attributes, external conditions).
Proactive Offer Generation: Automatically create and target offers to fill gaps in the calendar.
Revenue Optimization Algorithms: Use machine learning to continuously improve pricing and offer strategies.
Business Intelligence: Provide insights and recommendations for revenue growth.


Potential New Features:

Revenue Dashboard: Show real-time and projected revenue, with comparisons to historical data.
Occupancy Optimizer: Suggest strategies to fill low-occupancy time slots.
Customer Lifetime Value Predictor: Help businesses identify and retain high-value customers.
Competitive Analysis Tool: If possible, provide insights on local market pricing and demand.
Scenario Planner: Allow businesses to model different pricing and offer strategies.


Integration Possibilities:

Marketing Automation: Trigger email campaigns or SMS offers based on calendar gaps.
Customer Relationship Management (CRM): Deep integration to leverage customer data for personalized pricing and offers.
Payment Processing: Offer flexible payment options to increase bookings (e.g., deposits, installments).


Challenges to Consider:

Data Privacy: Ensure compliance with data protection regulations when using customer data for pricing.
User Education: Some businesses might need guidance on dynamic pricing strategies.
Balancing Automation and Control: Allow businesses to set boundaries for automated pricing and offers.


Communication Strategy:

Emphasize ROI: Show potential customers how Breezbook can increase their bottom line.
Case Studies: Develop detailed case studies showing revenue improvements for different business types.
Interactive Demo: Create a demo that allows potential customers to see how the system could work with their own data.


Potential Taglines:

"Breezbook: Turning Empty Slots into Revenue"
"Maximize Every Minute with Breezbook"
"Breezbook: Your AI-Powered Revenue Optimization Partner"


Future Expansion Possibilities:

Industry-Specific Modules: Develop specialized features for different sectors (e.g., healthcare, beauty, professional services).
Predictive Analytics: Use historical data and external factors to forecast demand and suggest proactive strategies.
Supply Chain Integration: For businesses that require supplies, integrate with inventory systems to optimize pricing based on cost fluctuations.



This evolution positions Breezbook as much more than a booking system – it becomes a comprehensive revenue optimization platform. 
It addresses a critical business need (maximizing revenue) rather than just solving an operational problem (managing bookings).

To implement this vision:

Start with a Minimum Viable Product (MVP) that includes basic dynamic pricing and offer generation.
Gather data and feedback from early adopters to refine the algorithms.
Gradually introduce more sophisticated features, always focusing on the core mission of revenue maximization.
Develop strong analytics and reporting features to clearly demonstrate the value Breezbook provides.
Consider a tiered pricing model, where advanced revenue optimization features are available in higher-tier plans.

This approach could significantly differentiate Breezbook in the market and provide substantial value to your customers. 
It aligns the success of your platform directly with the financial success of your clients, creating a strong value 
proposition and potentially fostering long-term customer loyalty.
```

The revenue maximiser for your bookings business.  
Most booking systems solve the operational need of managing bookings.
Breezbook optimizes bookings, pricing, and customer engagement to keep your calendar full, and your revenue maxed.

## Factor versus Attribute

Claude went with PricingFactor initially, and I changed that to PricingAttribute, as I was trying to understand what it
produced. I think I will switch back to Factor though, because some pricing factors - like weather - are not attributes
of any booking domain objects.

## Implementing increased pricing for a particular personal trainer

I think what I would like to do is to be able to make resources with metadata, so I can place each personal trainer into
a tiered
system, and then I can implement tiered pricing.

Recall that pricing happens after availability checking. So for this to work, the availability check needs to return
much more
data than it currently does. Right now, it only returns time and base price. Recall that an availability check gets a
service id,
a data range, and some optional fixed resource preferences. It should return at least the following additional items:

- how much capacity is possible at this time
- how much capacity is already booked at this time
- what resources are assigned to the proposed slot
- what alternative resources are available at the proposed slot

This will allow the pricing engine to make decisions based on the availability of resources.

# Tue 25 Jun 2024

It crossed my mind this morning that a pricing factor could be the query params that come in with the availability
check request, and these could be campaign identifers from google ads or what have you. This would allow the pricing
engine to make decisions based on the campaign that brought the customer to the site.

So for sure `PricingFactor` is a better name than `PricingAttribute`.

# Wed 26 Jun 2024

I proved resource dependent pricing this morning, by adding metadata support to `Resource` and then adding a tier to the
personal trainer in my gym test tenant. Following that, I added support for `resource metadata` as a pricing factor. And
the final piece was to create a `PricingRule` that added to the cost for an `elite` tier trainer. Seems to be a nice
assembly
of parts.

## Supporting multiple languages

I have now turned my attention to adding support for multiple languages. Mete said he thinks he can line up sales people
in Turkey to sell into businesses. So I set myself the goal of supporting Turkish and English in my gym demo tenant.

The first logical-seeming step was to factor our text that can be presented to users to tables that are keyed by
language.
Some examples of the kind of attributes I'm talking about:

- Service name and description
- Add-on name and description
- Resource name
- Forms (they contain json schema which has property names)
- Resource branding and markup
- Tenant branding

Take `service` as an example. It now has a companion table called `service_translations` that contains a language code
and the name and description of the service in that language.
The `service` table no longer has a name or a description. To preserve the current domain object `Service`, I have been
extending
my prisma queries to take a language code, and then join the `service_translations` table to get the name and
description.
The construct the domain `Service` using both rows.

This has exposed a force in the code that is now pushing back on me. I find that I am in the availability check code,
and
in need of adding a language code to the request. Language has nothing to do with availability checking tho. It is a
concern of the presentation layer. I do think I should add service name and description in the availability check
response,
but language has nothing to do with the core availability checking logic.

I found that dealing with pricing in the abstract in its own package and its own domain yielded a coherent solution. I
wonder if the same might not be true for availability checking? I'm going to see what Claude thinks a generic
availability
checking solution is like.

## The result of the above

Claude came up with a solution that is based around the following types. But note that I did not dialogue this into all
availability check cases that we currently support:

```typescript
interface Resource {
    id: string;
    type: string; // e.g., 'provider', 'room', 'equipment'
}

interface ResourceRequest {
    type: string;
    specificId?: string;
    anyOfIds?: string[];
}

interface TimeSlot {
    startTime: Date;
    endTime: Date;
}

interface ResourceAvailability {
    resourceId: string;
    availableSlots: TimeSlot[];
}

interface Appointment {
    id: string;
    startTime: Date;
    endTime: Date;
    resources: Resource[];
    capacity: number;
    currentBookings: number;
}

interface AvailabilityRequest {
    requestedDateTime: Date;
    durationMinutes: number;
    resourceRequests: ResourceRequest[];
    existingAppointments: Appointment[];
    resourceAvailability: ResourceAvailability[];
    partySize: number;
    specificRequirements?: {
        [key: string]: any;
    };
}

interface AvailabilityResult {
    isAvailable: boolean;
    conflicts: {
        resourceRequest: ResourceRequest;
        conflictingAppointments: Appointment[];
    }[];
    unavailableResources: {
        resourceRequest: ResourceRequest;
        unavailableIds: string[];
    }[];
    capacityIssues: {
        appointment: Appointment;
        availableSpots: number;
    }[];
    selectedResources: Resource[];
    alternativeSlots?: Date[];
}

function checkAvailability(request: AvailabilityRequest): AvailabilityResult {
    // Implementation here
}
```

Comparing this to the domain objects that my current availability check function takes, Claude's function has no concern
with:

- service.price
- service.descriptors (text, descriptions, etc)
- service.add-ons
- service.forms
- booking.customer
- most of the AvailabilityConfig. I need this to convert from the config model (business opening hours, resource hours,
  blocked time ttems) to the domain model (availability check request). Which is a modeling mistake

This is the claude chat - https://claude.ai/chat/9ac33a78-a1b6-46e0-8e3c-8ae6e5908218

So it does indeed seem to me that I would have a win by modeling availability checking in its own package and domain.
But, I need
to stay close to working code right now, so I will not do this refactor now. I will put a name and description into
Service and
continue to use the availability check function as it is.

# Thu 27 Jun 2024

The above discovery, and the previous one about pricing, has me thinking that one of the most impactful discoveries in a
given software build is getting to the right bounded contexts. From there, you can focus on excellently implementing
that each concern, with a model fully germain to the concern.

Trying to find one model is a mistake.

For example, in my current domain of booking and appointments, I have discovered the following bounded contexts:

- Availability Checking
- Pricing
- Payment

Initially I was trying to service all of these concerns with a single model consisting of:

- Service (name, description, price, duration, resource requirements)
- Resource (name, description, type, capacity, available hours)
- Booking (service, location, start time, end time, customer, payment)
- Business configuration (opening hours, coupons, discounts, refund policy, locations)

Availability checking has no interest in price, or customer, or payment. Payment has no interest in resource
requirements.
As more bounded contexts emerged, and as each bounded context became more complex, increasing data demands were placed
on `Service` and `Resource` and `Booking` and they started to get fatter.

Test cases for the availability check had to setup a dummy price and name and description for the service.

So when I started to explore modeling availability checking as its own domain, I found it was only concerned with:

- Resource (type, available hours)
- Existing appointments (start time, end time, assigned resources, capacity)
- Availability request (start time, end time, resource requests, party size)

This is dramatically different to `Service` and `Resource` and `Booking` and frees me up tremendously.

Similarly, I initially tried to model pricing as a set of rules that could be applied to a `Service`. When I pulled
pricing out to a domain of its own, I found that it was only concerned with:

- Pricing factors
- Pricing rules
- Pricing engine

Totally different language. The resulting pricing package is clean, coherent, well tested and quite generic.

Finding these bounded contexts has been slow and painful. The principle indicators of potential boundary crossing have
been:

- setting up dummy data for "pointless" domain model attributes in tests
- domain model entities getting fatter
- having to reach hard to get "random" data at the edge of my app (e.g. endpoints)

I know I could have done big picture event storming, or other discovery techniques to maybe accelerate the discovery of
these boundaries. It just feels to me like feeling my way across the stones in the river is more my style. What can I
learn from this?

# Fri 28 Jun 2024

I reverted the last two days of work on language support. Trying to force in the concern of language into the
availability
check was going badly. I'm going to do the extraction of the availability check to its own package now and see how the
language support goes after that.

## Availability as its own domain

Having a fascinating chat with Claude about the domain of availability checking. I keep asking it to do more of what I
have
discovered as necessary to meet the anticipated needs of SME customers. When we got to the chat about resource
allocation,
I asked it to think about round-robin, least used, greedy allocation, and it duly obliged.

Then I asked if there was an existing library that did the kind of resource allocation we were talking about. It
mentioned
OptaPlanner, which is a constraint satisfaction solver. It seems really mature and capable. One of the articles on their
site is vehicle routing, which is exactly Nat's requirement. Round-robin and least used would have 5 vans on the road
for five bookings, which is likely inefficient. Greedy allocation might make it impossible for one van to get to all
give bookings.

So just before I started to think about modeling different resource allocation algos into my availability check
function,
I realised that if resource allocation of fungible resources is don't based on capacity, they a separate process can run
periodically to balance resource allocation. In other words, when doing availability checking, I can just have to check
that at least one suitable resource is available. On each booking, a process, maybe using OptaPlanner, can balance the
allocation of resources.

If a booking is found to be undeliverable during this process, some remedial action can be taken, in the worse case
scenario, the booking can be cancelled or rearranged.

## Update on the above

Availability checking in complex enough. It gets confusing quickly. I think creating a function that resources all
bookings will help. This will be useful in any case, to show the business admins how their calendar looks, and who is
doing what.

If I can get an array of resourced bookings, then I can pass that to the availability checker and take out a chunk of
complexity. Tomorrow.

# Sat 29 Jun 2024

Decent progress with the resourcing of bookings. I can do fungible and specific, with and without capacity. I realised
that the this function can be used for the availability check too. I can just create a booking and test whether it is
resourceable.

# Sun 30 Jun 2024

I realised this morning that an important feature of the `resourceBookings` function must be "disfavouring" certain
resources,
because I intend to use that function for my availability check function. If the availability check involves a potential
booking with specific resources, I want to do what I can to improve the changes of those resources being available.

So I wrote a test case intended to demonstrate that certain resources can be "disfavoured" in the allocation process.
In other words, considered last. I shared that with claude and it made code where an "options" object was passed to the
`resourceBookings` function. Surprise - quite a general idea. So I asked it what other options it envisioned. Super nice
answer, worth recording here:

```typescript
interface ResourceBookingsOptions {
    disfavoredResources?: Resource[];
    preferredResources?: Resource[];
    allocationStrategy?: 'balanced' | 'concentrated' | 'random';
    capacityThreshold?: number; // Percentage (0-100)
    timeBufferMinutes?: number;
    overbookingAllowancePercent?: number;
    resourceGroups?: { [groupId: string]: Resource[] };
    preferSameGroup?: boolean;
    maintenanceWindows?: { resource: Resource, windows: Timeslot[] }[];
    userPreferences?: { userId: string, preferredResources: Resource[] };
    bookingPriorities?: { [bookingId: string]: number }; // Higher number = higher priority
}

function resourceBookings(
    resources: Resource[],
    bookings: Booking[],
    options: ResourceBookingsOptions = {}
): {
    resourced: ResourcedBooking[];
    unresourceable: UnresourceableBooking[];
} {
    // Implementation would need to be updated to handle these new options
    // ...
}
```

With the following commentary:

- Preferred Resources: The opposite of disfavored resources, these would be prioritized in allocation.
- Allocation Strategy: We could allow different strategies like "balanced" (spread across resources), "concentrated" (
  use as few resources as possible), or "random".
- Capacity Threshold: A percentage of capacity to leave free, even if it means using more resources.
- Time Buffer: A buffer time between bookings for the same resource, useful for cleanup or setup.
- Overbooking Allowance: A small overbooking percentage for resources that can occasionally handle more than their
  stated capacity.
- Resource Grouping: Prefer to allocate resources from the same group (e.g., rooms on the same floor).
- Cost Optimization: If resources have associated costs, we could prioritize based on cost-effectiveness.
- Maintenance Windows: Times when certain resources should be avoided for scheduled maintenance.
- User Preferences: If there are user-specific preferences for certain resources.

## The disfavouring implementation

It worked out quite well:

```typescript
function assignLeastUsedResource(availableResources: ResourceUsage[], requirement: ResourceRequirement, resourcePreferences: ResourcePreferences, forTimeslot: Timeslot) {
    const countedUsage = availableResources.map(r => ({
        resource: r,
        count: r.bookings.length
    }))
    const sortedByUsage = countedUsage.sort((a, b) => a.count - b.count)
    const bestResource = sortedByUsage.find(r => !isDisfavored(r.resource.resource, resourcePreferences, forTimeslot))
    return bestResource ? resourceCommitment(requirement, bestResource.resource.resource) : resourceCommitment(requirement, sortedByUsage[0].resource.resource);
}

function isDisfavored(resource: Resource, resourcePreferences: ResourcePreferences, forTimeslot: Timeslot) {
    return resourcePreferences.disfavoredResources.some(r => r.resource.id.value === resource.id.value && r.slots.some(s => timeslotFns.overlaps(s, forTimeslot)))
}

```

# Mon 1 Jul 2024

Pushing through the new availability check code into package-core now. Issue is that package-resourcing depends on
package-core
and package-core now needs the availability function. I have started pulling out the shared types from package-core into
package-types, and stitching it back together. An issue has come up. The `service` in package-core depends on resource
requirements, which are in package-resourcing. resource requirements express a need on a `resource` type.
package-core also has a representation of `resource` tho, and the only difference is that is is named.

What happens if I try to drop the name on the resource and just use the definition from package-resourcing?

# Web 3 Jul 2024

I've been on a multi-day push to get the new resourcing/availability library integrated into the main app. Finally done.
The reason for going on this bender was to make it easier, hopefully, to support multiple languages.
Certainly, `Resource`
no longer have a name. And the `Service` in the resourcing package also doesn't have a name.

Having been burned by taking on all of the multi-language refactor in one go the last time, this time I am going to do
it
in stages. I think a general approach might be best thought about by working on `Service` first:

- Split `Service` into `Service` and `NamedService`
- Use `Service` in all endpoints and core logic
- Use `NamedService` only when returning responses to the frontend

Actually I wonder if this is thorough enough. There are things on service that have nothing to do with availability
checking,
for example. Like permitted add-ons. If I went through the entire call stack of the availability check endpoint, what
exact parts of service would be needed. Let me try that first.

## Update on the above

Ok, this seems to have worked out ok:

```typescript
export interface Service {
    id: ServiceId;
    duration: Minutes;
    resourceRequirements: ResourceRequirement[]
    price: Price;
    permittedAddOns: AddOnId[];
    serviceFormIds: FormId[];
    options: ServiceOption[];
    startTimes: StartTime[] | null;
    capacity: Capacity;
}

export interface ServiceLabels {
    name: string;
    description: string;
    serviceId: ServiceId
}
```

Using an extension of the `Service` type as `NamedService` meant that concerns were again coupled - if I wanted to deal
with just the name and description of a service, I had to deal with the price and resource requirements too. So I split
the `Service` type into `Service` and `ServiceLabels`, and there is no hard referential connection - they have to be
joined via the service id. I think this will work out ok.

# Thu 4 Jul 2024

Sometimes doing a big revert is the best possible move, deflating as it might be at the time. In fact, surely a refactor
that is never ending MUST be reverted, coz its a sign that it's wandering away from simplicity. In any case, I am
following
up on the above domain model changes with the corresponding database changes. Again, focusing on `service` only to get
to the end. It is looking nice so far. This feels solid:

```typescript
    const serviceUpserts = [
    upsertService({
        id: gym1Hr,
        tenant_id,
        environment_id,
        slug: 'gym1hr',
        duration_minutes: 60,
        price: 1500,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertServiceLabel({
        tenant_id,
        environment_id,
        service_id: gym1Hr,
        language_id: en,
        name: 'Gym session (1hr)',
        description: 'Gym session (1hr)'
    }),
    upsertService({
        id: pt1Hr,
        tenant_id,
        environment_id,
        slug: 'pt1hr',
        duration_minutes: 60,
        price: 7000,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertServiceLabel({
        tenant_id,
        environment_id,
        service_id: pt1Hr,
        language_id: en,
        name: 'Personal training (1hr)',
        description: 'A personal training session with one of our trainers, 60 minutes duration'
    }),
]

```

# Sat 6 Jul 2024

I spent a good chunk of yesterday bring the crazy excel-to-sql private repo - which was used to onboard tenants without
giving
away their prices and pricing rules etc - into the main app. There is now an internal endpoint that you can post an
excel file
to and it will create dev and prod tenants for you.

I took the time to invest in this, because I know so much of the schema is going to change as I move towards
multi-language.
But also afterwards also. It also means that I can drop this mental "publish reference data as mutations" endpoint,
which existed
to get records into the `mutations` table to enable replication to airtable.

## Update on migration to multi-language

It's going ok. The idea of pull out `X-Labels` types for the various types of `X` seems to hold. Most or all of the
business logic
has no interest in the language stuff, which I am calling "Labels". That concern sure does seem to sit at the edge of
the backend
and in the front end. I can do the work with un-named domain objects, then label then just before returning them.

It seems to play out ok in the database too. Tables are getting companion "labels" tables, joined by primary key and
language id.
I'm in the process of applying this to the dynamic json forms now. I was going to just require an entire new form
definition, but
the keys in the form needs to stay constant across language. For example, my form requesting "goals" from a customer in
the
gym tenant, has to keep the property name "goals" in the json schema, otherwise the data will not have a fixed shape.

So requiring an entire new json schema seems to not work. I thought of adding markup to the json schema to support
language.
But extending json schema seldom goes will in my experience. What I hit on is a slight tweak on the labels idea, to suit
a json schema better. Hopefully the following types will make it clear what I am thinking:

```typescript
const goalsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "goals-form"
    },
    "name": "Goals Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "goals": {
                "type": "string"
            },
        },
        "required": [
            "goals",
        ],
        "additionalProperties": false
    }
};

const goalsFormLabelsEnglish = jsonSchemaFormLabels(
    goalsForm.id,
    languages.en,
    "Your goals",
    [schemaKeyLabel("goals", "Goals")],
    "What are your fitness goals")

const goalsFormLabelsTurkish = jsonSchemaFormLabels(
    goalsForm.id,
    languages.tr,
    "Hedefleriniz",
    [schemaKeyLabel("goals", "Hedefler")],
    "Spor hedefleriniz nelerdir")
```

# Mon 8 Jul 2024

The personal training demo is done now. It demonstrates the following:

- themeing
- multiple languages
- multiple locations
- resource dependent pricing (Mete is more expensive as an "elite" trainer)

Am starting on the dog walking demo now. And I quickly hit on a new pricing mechanism that I don't support. Per-hour
pricing. How did I miss this????

I asked Claude how a dog walker might price their services. It said this:

## Dog Walking and Pet Care Services Pricing Structure

### 1. Individual Walk

- Base rate: $20-$30 for a 30-minute walk
- Additional time: $10-$15 per 15 minutes
- Factors affecting price:
    - Dog size/energy level
    - Number of dogs from the same household
    - Time of day (premium for early morning or late evening)

### 2. Group Walk

- Base rate: $15-$25 per dog for a 60-minute walk
- Usually limited to 3-5 dogs per group
- Potential discount for multiple dogs from the same household

### 3. Drop-in Visit

- Base rate: $15-$25 for a 20-30 minute visit
- Additional services (e.g., administering medication): $5-$10 extra

### 4. Pet Sitting Visit

- Base rate: $40-$60 for a 2-hour visit
- Additional time: $15-$20 per hour
- Overnight stay (8-12 hours): $70-$100
- Services typically included:
    - Feeding and refreshing water
    - Playtime and exercise
    - Administering medication (if needed)
    - Litter box cleaning for cats
    - Brief house-sitting duties (mail collection, plant watering)

### Additional Fees

- Holiday surcharge: 1.5x regular rate
- Last-minute booking fee (less than 24 hours notice): $5-$10
- Extended travel fee (outside normal service area): $0.50-$1 per mile

### Package Deals

- Weekly package (5 walks or visits): 10% discount
- Monthly package (20 walks or visits): 15% discount
- Mix and match services (e.g., 3 walks, 2 pet sitting visits per week): Custom pricing

### Cancellation Policy

- More than 24 hours notice: Full refund
- 12-24 hours notice: 50% refund
- Less than 12 hours notice: No refund

Note: All prices are in USD and should be adjusted based on local market rates and cost of living. Pet sitting rates
may vary based on the number and types of pets, and any special care requirements.

Chatting with Claude, the key take away was something like this:

```typescript
// Example usage:
const dogWalkingPricingMatrix = createPricingMatrix('dog-walking-matrix', [
    {
        resourceId: resourceId('alex'),
        serviceId: serviceId('individual-walk'),
        timePricingRule: {
            initialDuration: minutes(60), // might be modeled on the service
            initialPrice: price(2000), // £20 for first hour , or the base duration of the service
            additionalPricePoints: [
                {duration: minutes(15), price: price(500)}, // £5 per additional 15 minutes
                {duration: minutes(30), price: price(1000)}, // £10 per additional 30 minutes
            ]
        }
    },
    {
        resourceId: resourceId('jordan'),
        serviceId: serviceId('individual-walk'),
        timePricingRule: {
            initialDuration: minutes(60),
            initialPrice: price(1800), // £18 for first hour
            additionalPricePoints: [
                {duration: minutes(30), price: price(900)}, // £9 per additional 30 minutes
            ]
        }
    },
    // ... other entries ...
]);
```

Some services have a fixed time - a group dog walk in 60 minutes. And it will probably be offered at time slots. Like
a group dog walk in the morning and another in the evening. With individual dog walks in between. The individual dog
walks are priced per hour or in 15 min increments, and each walker has their own pricing.

So some new modeling concepts fall out of this.

- a service can be fixed in duration, or flexible, with a min, max and increment I guess.
- a service can be offered at specific times, or at any time. The morning and evening group walks might be 9am to 10am
  and 6pm to 7pm. The individual walks might be offered at any time, but crucially not at those time slotted times.  
  In other words a service can have its own availability
- personalised pricing for a service.
- time based pricing, explicitly modeled as a "Price sheet" - in this case as a matrix
- accounting for additional time pricing in the price sheet

One common need for dog walkers is to offer a discount for multiple dogs from the same household. How can I model this
pricing well? I think it feels like an add-on. The add-on is "additional dog from the same household", and maybe it
has a quantity associated with it. The total quantity of dogs will include the initial dog and the number of add-ons -
when it comes to figuring out when a group walk is full. Will this be complex? Maybe.

Another approach is in the general case of a group booking, where the price is per person/dog/cat, and the option
to express a discount for the second and subsequent party members. This is a more general case.

Thinking about add-ons, adding time could be a priced add-on that extends the duration of the service. We support this
already, so this would mean no need to add in pricing matrices and sheets etc. Lets see how far we can get
with that.

If I add the ability to mark "capacity" based services as permitting extra party members during booking, at an optional
discounted rate, then I think I will have a general solution for the dog walking pricing - without getting seduced into
the complexity of pricing matrices and sheets.

The UX of the app might be best placed to select the initial service, show add-ons and on that screen, prompt for extra
party members i.e. "adding" is done in one place.

# Tue 9 Jul 2024

I was working through creating the necessary mutations to make my test dog walking client, and I was about to make the
add-ons
for the extra 30 mins and the extra dog. But then I realised that add-ons do not extend the duration of a booking. And
then I
remembered that `Service Options` do. This makes sense. First you pick all things that define the length, capacity and
base
price of the service. Then add-ons, their purpose is to add items that can be done in the same time, for an extra
charge.  
So that might be watering plants or giving the dog medicine.

So am going to push through the service option implementation

# Thu 11 Jul 2024

Service Options to express the ability to extend the duration of a service are in and the dog walking demo app is not
too
shabby.

But now I want to implement the following pricing rules, which come from a real dog walker's site:

- weekends are £2 more expensive
- holidays (bank holidays, christmas, new year) are 1.5x more expensive

This is implicitly speaking about the per-hour price of the service. How might I price this service if it was on a
Saturday:

- Individual walk, 60 minutes, £20 per hour
- Additional time, 30 minutes, £15 per hour
- Extra dog from same house-hold, £10 fixed price (probably would be per hour in reality, but I want to cover cases)

I possible could model these pricing rules using what we already have by making `numberOfHours` a pricing factor, along
with
`isWeekend` and `isHoliday` (which will need a holiday calendar I assume).

I am torn between trying to implement this pricing using the model I have, versus modeling services that are priced per
hour explicitly. I have to see if it can be done using what I have, but for the record, Claude and me riffed out
something like
this:

```typescript
export type ServicePricing = FixedPricing | HourlyPricing;

export interface FixedPricing {
    type: 'fixed';
    price: Price;
    duration: Minutes;
}

export interface HourlyPricing {
    type: 'hourly';
    pricePerHour: Price;
    minimumDuration: Minutes;
    maximumDuration?: Minutes;
}


export interface Service {
    id: ServiceId;
    pricing: ServicePricing
    resourceRequirements: ResourceRequirement[]
    permittedAddOns: AddOnId[];
    serviceFormIds: FormId[];
    options: ServiceOption[];
    startTimes: StartTime[] | null;
    capacity: Capacity;
}
```

It feels compelling cos it seems to model reality better. Let's see how I get on with the model I have now, and come
back to this.

## Update on the above

It has not worked out terrible:

```typescript
const addMoreForEvening: PricingRule = {
    id: 'add-more-for-evening',
    name: 'Add More For Evening',
    description: 'Add more for evening hours between 18:00 and 24:00',
    requiredFactors: [
        parameterisedPricingFactor('hourCount', 'numberOfEveningHours', {
            startingTime: time24("18:00"),
            endingTime: time24("24:00")
        })
    ],
    mutations: [
        {
            condition: jexlExpression('numberOfEveningHours > 0'),
            mutation: add(jexlExpression('numberOfEveningHours * 100')),
            description: 'Add £1 per-hour for evening bookings',
        },
    ],
    applyAllOrFirst: 'all'
};
```

This has made pricing more general. It used to be the case that `requiredFactors` was just the name of the factor.
But more general support like this means we can configure factor to some small degree.

# Fri 12 Jul 2024

It has been valuable to do this dog walking demo, because it uses "service options" to extend the duration and price of
the booking. Which means my availability check endpoint, which returns priced time slots, needs to returns pricing
breakdown for the service and the service options the user has selected, for each slot

So the availability endpoint will need to get a mini-basket posted to it, and it will need to return a priced basket for 
each slot.  I assume this is the best way to go?

After some poking around, it actually seems that it might be best to just use the existing `UnpricedBasket` to make the
request for availability, and return a `PricedBasket` for each times slot. 

I think the best way to get there is to to test drive the changes into the `priceBasket` function.

I'm also starting to think that services and service options will eventually need to have pricing rules associated directly
to them, rather than just having global pricing rules.  Am not sure tho, lets see how it plays out.