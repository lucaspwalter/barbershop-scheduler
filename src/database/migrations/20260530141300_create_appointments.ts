import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('barber_id').notNullable().references('id').inTable('barbers');
    table.uuid('service_id').notNullable().references('id').inTable('services');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.specificType('starts_at', 'timestamptz').notNullable();
    table.specificType('ends_at', 'timestamptz').notNullable();
    table.string('status', 20).notNullable().defaultTo('scheduled');
    table.text('notes');
    table.specificType('created_at', 'timestamptz').notNullable().defaultTo(knex.raw('now()'));

    table.check(
      "status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')",
      [],
      'appointments_status_check',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('appointments');
}
