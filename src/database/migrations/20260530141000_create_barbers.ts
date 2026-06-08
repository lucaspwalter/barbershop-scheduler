import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('barbers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('phone', 20);
    table.text('avatar_url');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.specificType('created_at', 'timestamptz').notNullable().defaultTo(knex.raw('now()'));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('barbers');
}
