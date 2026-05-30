import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('appointment_id').references('id').inTable('appointments');
    table.string('type', 50).notNullable();
    table.text('message').notNullable();
    table.specificType('sent_at', 'timestamptz');
    table.string('status', 20).defaultTo('pending');
    table.specificType('created_at', 'timestamptz').notNullable().defaultTo(knex.raw('now()'));

    table.check("status in ('pending', 'sent', 'failed')", [], 'notifications_status_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
