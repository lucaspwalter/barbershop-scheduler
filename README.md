# Barbershop Scheduler

## What it is

Barbershops that manage appointments manually can miss time slots, create scheduling conflicts, and leave customers without confirmation. Barbershop Scheduler organizes this workflow in an application for managing customers, barbers, services, appointments, waitlists, and notifications.

The project handles appointment management with conflict validation, waitlisted customer tracking, WhatsApp confirmations, and reports that support daily barbershop operations.

## Portfolio

This project is part of my portfolio:

https://lucaspwalter.github.io/portfolio/

## How it works

- Appointment scheduling with conflict detection across barbers, customers, and services.
- Waitlist for customers unable to find an available time slot.
- WhatsApp notification engine using Evolution API.
- Reports for tracking appointments, services, and barbershop activity.

## WhatsApp notifications

WhatsApp integration requires the user's own Evolution API instance.

Documentation:

https://doc.evolution-api.com

To test:

- Create a customer with a real phone number.
- Create an appointment for that customer.
- Check the result at `/notifications` in the frontend.

## Technologies

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Knex
- Next.js

## Running locally

With Docker installed:

```bash
git clone https://github.com/lucaspwalter/barbershop-scheduler.git
cd barbershop-scheduler
docker compose up
```

Open `http://localhost:3000`. For sample data, keep the backend running and run `npm run seed` in another terminal.

Manual instructions are also available on the project's portfolio page:

https://lucaspwalter.github.io/portfolio/

## Project structure

```text
barbershop-scheduler/
├── frontend/
│   ├── app/
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── next.config.mjs
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── database/
│   │   ├── migrations/
│   │   ├── connection.ts
│   │   └── knex-config.ts
│   ├── errors/
│   │   └── app-error.ts
│   ├── lib/
│   │   └── evolution.ts
│   ├── modules/
│   │   ├── appointments/
│   │   ├── barbers/
│   │   ├── clients/
│   │   ├── notifications/
│   │   ├── queue/
│   │   ├── reports/
│   │   └── services/
│   └── index.ts
├── knexfile.ts
├── package.json
├── seed.ts
├── setup.ps1
├── setup.sh
└── tsconfig.json
```
