import knex from 'knex';
import knexConfig from './knex-config';

export const db = knex(knexConfig);
