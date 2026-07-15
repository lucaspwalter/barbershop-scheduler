import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('waiting_queue', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('barber_id').notNullable().references('id').inTable('barbers');
    table.uuid('service_id').notNullable().references('id').inTable('services');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.integer('position').notNullable();
    table.integer('estimated_wait_minutes');
    table.specificType('joined_at', 'timestamptz').notNullable().defaultTo(knex.raw('now()'));
    table.string('status', 20).notNullable().defaultTo('waiting');

    table.check(
      "status in ('waiting', 'called', 'in_progress', 'done', 'cancelled')",
      [],
      'waiting_queue_status_check',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('waiting_queue');
}
