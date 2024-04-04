While working on this booking/appointmenting app, I need to get data from it into airtable.
Zapier and make.com can map data from webhooks to airtable tables.  And the same can be used to 
push changes in airtable back to my app.  But I have the following requirements:

1. I do not want to have to maintain mappings between the primary keys in my app (which might be composite)
   and the airtable record ids.  I want the integration layer to handle this.
2. I want to be able to setup and change the mappings between my app and airtable using an API
3. I want the mapping definition to be easy to read and understand
4. Pushing from my app to airtable can be done by incremental record building, because airtable has weak data integrity
   rules.  So I can build part of an airtable customer record from one table as one push and the remainder from another table 
   as a second push.  But going the other way - from airtable to my app - works differently.  If a customer is split across 
   two tables in airtable, lets say first name and last name come from one table and the customer email and phone number 
   come from another table, but all four fields are required in my app, then I want this record merging to happen in 
   the integration layer, and I want it to be easy to configure.

Zapier and make.com do not seem to solve this well, and I'm not aware of any existing product that does all of the above
in a way that I like.  Whalesync is expensive.