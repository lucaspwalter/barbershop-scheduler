import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.integer('duration_minutes').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.specificType('created_at', 'timestamptz').notNullable().defaultTo(knex.raw('now()'));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('services');
}
