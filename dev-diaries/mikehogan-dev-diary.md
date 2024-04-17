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