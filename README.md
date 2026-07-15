# Barbershop Scheduler

## O que é

Barbearias que controlam agendamentos manualmente podem perder horários, criar conflitos na agenda e deixar clientes sem confirmação. O Barbershop Scheduler organiza esse fluxo em uma aplicação com cadastro de clientes, barbeiros, serviços, horários, fila de espera e notificações.

O projeto resolve o gerenciamento de agendamentos com validação de conflitos, acompanhamento de clientes em espera, envio de confirmações por WhatsApp e relatórios para apoiar a rotina da barbearia.

## Portfólio

Este projeto faz parte do meu portfólio:

https://lucaspwalter.github.io/portfolio/

## Como funciona

- Agendamento com detecção de conflito de horários entre barbeiro, cliente e serviço.
- Fila de espera para clientes que não conseguem um horário disponível.
- Engine de notificações WhatsApp usando Evolution API.
- Geração de relatórios para acompanhar agendamentos, serviços e movimentação da barbearia.

## Notificações WhatsApp

A integração com WhatsApp requer uma Evolution API própria do usuário.

Documentação:

https://doc.evolution-api.com

Para testar:

- Crie um cliente com um número real.
- Crie um agendamento para esse cliente.
- Verifique o resultado em `/notifications` no front-end.

## Tecnologias

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Knex
- Next.js

## Como rodar localmente

Com Docker instalado:

```bash
git clone https://github.com/lucaspwalter/barbershop-scheduler.git
cd barbershop-scheduler
docker compose up
```

Acesse `http://localhost:3000`. Para dados demonstrativos, com o backend ativo, rode `npm run seed` em outro terminal.

Instruções manuais também estão disponíveis na página do projeto no portfólio:

https://lucaspwalter.github.io/portfolio/

## Estrutura do projeto

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
