# BreezBook

BreezBook is an open-source white-label booking app that can be used by customers to book appointments with a business.
It will focus only on the booking experience, integrating with low-code tools like Airtable/SmartSuite etc to manage the
remaining processes of the business.

## Why BreezBook?

Existing booking apps like Acuity offer pretty vanilla booking experiences. Their forums are full of people asking for
features that would delight their customers during the booking process.

BreezBook will focus hard on best-in-class booking experiences, and integrate with low-code tools like
Airtable/SmartSuite etc. to manage the remaining processes of the business.

## Features

  - White-label for multiple tenants
  - Services for a tenant
  - Multiple services for a tenant
  - Time slots
     <!-- TODO Different services may share the same time slots -->
  - Accessories
  - Extra customer details specific to the service
  - Cart system for multiple bookings or services
  - Payment
  - Dynamic pricing
  - Custom themes
      - Automatic theme detection from the tenant's website

## Tech Stack

- Turborepo
- TypeScript
- SvelteKit
- TailwindCSS + DaisyUI
- Stripe
- Vercel
- Airtable
- AI

## What's inside?

This repo includes the following packages/apps:

### Apps and Packages

- `@breezbook/booking`: Booking app made with SvelteKit for customers to book appointments with the business
- `@breezbook/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@breezbook/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```bash
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```bash
pnpm dev
```

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to
share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't
have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with
your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
