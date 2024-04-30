# Breezbook Privacy Policy

I never wrote a privacy policy before, so I asked Claude:

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

So this privacy policy is going to be a file in github (the benefit of open source), and I will link to it from the
breezbook website.  Edit history will then come for free, helping with transparency.

## 1. What types of personal data do you collect from users (e.g., name, email address, phone number, payment information)?
There are two categories of users in breezbook:

### 1.1 Users of Breezbook
This class of "person" belongs to a business of some sort that is based on bookings and appointments.  To define terms, 
let's call these "business users".  We do not yet collect any information on business users, but soon we will, to 
enable billing and administration of the service.  We will collect:

 - Name
 - Email
 - Business Name
 - Business Address
 - Credit Card information for billing

### 1.2 Users of the business
This class of "person" are those making bookings and appointments with the business.  Let's call these "customer users".

 - Name
 - Email

However, each business can extend the personal information collected by the system by adding custom fields to the booking.

Because this is an open source project, you can find the basic database schema for this class of user 
[here](https://github.com/cozemble/breezbook/blob/38e6a8a9f95185eb687872d659a587a75d8de3f9/backend/airtable/migrations/schema/001.do.base-tables.sql#L212).

## 2. How do you collect this personal data (e.g., user registration, booking/appointment forms, third-party integrations)?

### 2.1 Business Users
When we do get around to collecting information on business users, it will be in an onboarding process, where they will
fill in their personal information and credit card information.  They will have the ability to view and edit this 
information.

### 2.2 Customer Users
During the process of booking an appointment, the customer must provide at least their name and email address.  They
may also be required to provide other information, depending on the business's requirements.  This data will be captured
in a form during the booking process.

## 3. What is the purpose of collecting this personal data (e.g., providing the service, communication, marketing)?

### 3.1 Business Users
The purpose of collecting information on business users is to enable billing and administration of the service.

### 3.2 Customer Users
The purpose of collecting information on customer users is to enable the business to contact them about their booking.
But also, if the user wishes to amend or cancel their booking, they can do so by providing their email address.

# 4. Do you share any personal data with third parties? If so, who are they, and for what purpose?

We do not share any personal data with third parties.  However, Breezbook aims to make it really easy for a business
to push booking data into Airtable/Smartsuite, etc.  This would obviously be to an Airtable/Smartsuite account that they
own and control.  At this stage, personal data would have left the Breezbook system, and we would have no control over
what happens to it.

# 5. How do you protect the personal data you collect (e.g., encryption, access controls, security measures)?

We use industry standard encryption and access controls to protect the personal data we collect.

# 6. How long do you retain the personal data, and what is your data deletion policy?

## 6.1 Business Users
We retain the information as long as the business is a customer of Breezbook.  If the business cancels their 
subscription, we will retain the information for 30 days, in case they wish to re-subscribe.  After 30 days, we will
delete the information.

## 6.2 Customer Users
We retain the information on customer users as long as the business is a customer of Breezbook.  If the business cancels
their subscription, we will retain the information for 30 days, in case they wish to re-subscribe.  After 30 days, we will
delete the information.

# 7. Do you use cookies or similar tracking technologies on your website/platform? If so, what types of cookies and for what purpose?

We do not use cookies ourselves.  However, we (will soon) use screen recording software to record user interactions 
with the website, to help us improve the user experience, and these systems might use cookies.

# 8. Do you transfer any personal data internationally? If so, to which countries and under what legal mechanisms?

We do not transfer any personal data internationally.

# 9. How can users access, update, or delete their personal data?

## 9.1 Business Users
Business users can access, update, or delete their personal data by logging into the Breezbook website.

## 9.2 Customer Users
Customer users have no login to Breezbook, so they cannot access, update, or delete their personal data.  However, they
can amend bookings, and the personal details associated with them, using one-time links sent to their email address.

# 10. How do you handle personal data of minors (if applicable)?

We do not handle personal data of minors.

# 11. How do you communicate changes to your privacy policy to users?
As this is an open source project, this privacy policy is a version-tracked file in github.  This will offer one
level of transparency.  We will also email all users of Breezbook when we make changes to the privacy policy.

# 12. What is your process for handling data breaches or security incidents?

If we have a data breach or security incident, we will notify all users of Breezbook within 72 hours of becoming aware
of the breach.  We will also notify the relevant authorities.  We are registered with the Information Commissioner's
Office in the United Kingdom.

# 13. Are there any industry-specific regulations or compliance requirements that apply to your SaaS (e.g., HIPAA for healthcare-related services)?

We are not aware of any industry-specific regulations or compliance requirements that apply to Breezbook.

# 14. In which jurisdictions do you operate, and are there any specific privacy laws that apply (e.g., GDPR, CCPA)?

We operate in the United Kingdom.  We are aware of the GDPR and CCPA, and we are compliant with these regulations.
