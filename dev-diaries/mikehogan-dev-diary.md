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

I added code into the app yesterday to set-up a test tenant when it boots against an empty database.  All works fine
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

when the image is run on Google Cloud Run.  The env vars seem the same to me.  So am now adding a 20 sec delay between the app booting
and attempting to acquire a pooled connection, to see if that makes a difference.  It did not.  Neither did adding `?pgBouncer=true` to the
database connection url.  Turning on prisma logging at `info` level revealed nothing.  Now adding an endpoint to do the
setup, to see why endpoints work and this auto-setup does not.  So when I call the same code in an endpoint, it works fine.
Going to try calling the endpoint after the app boots, and see if that solves the issue.  So calling the endpoint right after the app
boots also fails with the same error.  This time trying to call it using the public endpoint, rather than the internal one.
That worked.  WTF?

# Fri 19 Apr 2024
The work I did a few days ago, adding an optional `location_id` to `services` and other tables, means I can have a 
service at global space shared by all locations, or a service at one local space.  But I can't have a service at two 
of three locations.  I think this is a better way to model the domain.  So now we're talking about a mapping between
services and locations.  So it sounds like a `service_locations` table is calling.

My mind finds it easier to work with examples, so I'm going to model a gym in several locations, offering different 
services, some of them global, some of them local, and others in several locations.

In doing this, setting up a multi-location gym model, it became obvious that location needs to be on 
`resource_availability`, rather on `resources`.  This is because a resource can be available at one location for one
period of time, and at another location for another period of time.  So I'm going to move `location_id` to 
`resource_availability`.

# Sun 21 Apr 2024
Still working through the multi-location model of a gym, testing as I go.  It's fun :)  My tests are against a massive
fixture that models the gym with three locations, which is a bit hard for newcomers to follow, I expect.  But the 
reason I am pursuing it is that the fixture is prisma code, that uses prismock in my tests, but real prisma when 
inserting into the database a test tenant.  Is this a sensible trade-off?  Let's see how it plays out.

Anyway, first cut of location support done.  Here is the fixture that sets up 
[a multi-location gym](https://github.com/cozemble/breezbook/blob/9262682c14520974299c2aca0bb4cf706228306e/backend/airtable/src/dx/loadMultiLocationGymTenant.ts#L1)
and here are [the tests for it](https://github.com/cozemble/breezbook/blob/8accf91e4e909aacc226d1b791d539afba1a8de0/backend/airtable/test/availability/byLocation.spec.ts#L15)

# Mon 22 Apr 2024
Deploying location stuff now.

Had a thought about IDs in this multi-environment infra we've got.  Right now, a service has its own `service_id` as a primary key.
It also has a `tenant_id` and an `environment_id`.  Having a `service_id` is kinda nice, because it makes foreign key management easy.
But if I used a compound key of `tenant_id`,`environment_id` and `service_id`, then it would be really easy to copy data
from environment to environment.  There would be no need to worry about tracking primary key re-mapping between services
and locations and orders etc - just change the `environment_id`.  It would make testing out data changes in an environment almost
trivial.  And it would make pulling data down from production to a test environment almost trivial. One of those to stew on.

# Fri 26 Apr 2024

Loaded all the services for the car wash business.  There are many services.  So it looks like we'll need to provide
some kind of categorisation ability.

# Sat 27 Apr 2024
In terms of onboarding our first customer, I'm writing scripts to import their data from excel files.  Do things that
don't scale they say.  While I decided that replicating booking data into Airtable was the way to go to give this
client extensibilty in terms of automation of their business, I decided to not implement import of configuration data
from Airtable.

Where this goes ultimately, I'm not sure.  I thought my blinding insight was to not make a database this time, to focus
instead on making an excellent booking experience backed by Airtable/SmartSuite etc.  I'm continually back and forth on
this.  Taking this approach might be nice to get started, but is it something people are looking for?  Would 
"the shopify of bookings" be a better long term offering?  Shopify does everything an ecommerce business could want.
Should breezbook take the same line for booking based businesses?

To be honest, I think the real reason I felt excited about using Airtable was the backend, was that it enabled my client
to set-up Gmail automations, and I am fearful of adding any Google integrations into my apps due to the expense of the
security reviews that are seemingly required to get my app verified.  So this is a decision based on fear and
ignorance.  I need to find someone who has been down this road before.

I just did a search on perplexity.ai, and it seems that what I fear is the case.  I can understand why Google have put 
this in place, but gosh it's a pita to get a small side project started.  
[This person](https://www.reddit.com/r/GoogleAppsScript/comments/os2kap/oauth_scope_verification_for_publishing_an_app_to/) 
says that unless your product is going to make $25k a year, don't bother.

# Mon 29 Apr 2024

It's time to make my Airtable OAuth Application be a production version.  For that, I need a Privacy Policy and Terms of
Service.  I asked Claude 

_What questions would you ask me if I wanted you to generate a privacy policy for my new booking/appointmenting SaaS?_

and it returned:

1. What types of personal data do you collect from users (e.g., name, email address, phone number, payment information)?
2. How do you collect this personal data (e.g., user registration, booking/appointment forms, third-party integrations)?
3. What is the purpose of collecting this personal data (e.g., providing the service, communication, marketing)?
4. Do you share any personal data with third parties? If so, who are they, and for what purpose?
5. How do you protect the personal data you collect (e.g., encryption, access controls, security measures)?
6. How long do you retain the personal data, and what is your data deletion policy?
7. Do you use cookies or similar tracking technologies on your website/platform? If so, what types of cookies and for what purpose?
8. Do you transfer any personal data internationally? If so, to which countries and under what legal mechanisms?
9. How can users access, update, or delete their personal data?
10. How do you handle personal data of minors (if applicable)?
11. How do you communicate changes to your privacy policy to users?
12. What is your process for handling data breaches or security incidents?
13. Are there any industry-specific regulations or compliance requirements that apply to your SaaS (e.g., HIPAA for healthcare-related services)?
14. In which jurisdictions do you operate, and are there any specific privacy laws that apply (e.g., GDPR, CCPA)?

So I'm going to turn my privacy policy into a file in github (the benefit of open source) and then link to it from my website

# Tue 30 Apr 2024

Turning attention to airtable integration again.  Nat has provided me the Airtable base and tables that he wants to map
Breebook bookings into.  At this stage I feel the need for a tool that does this:

 * Connects to an airtable base and inspects the tables
 * Connects to my postgres database, and allows me to filter down to source tables, and from there down to source records,
   by specifying a filter query (by tenant id and environment id in this case).  This might be impractical in the general
   case, but what I'm after is some means of stating what my source record payloads are.  Pasting a bunch of exemplar 
   payloads into textboxes would also be ok.
 * Define my mapping plan and see which source records it selects, and what airtable mutations it emits

I'm going to do this in a unit test for now, which might be the better engineering approach.  But I can't help but think
that there is a generic product sitting under this need.