import 'dotenv/config';
import type { Knex } from 'knex';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const databaseUrl = new URL(connectionString);
const isLocalDatabase = ['localhost', '127.0.0.1'].includes(databaseUrl.hostname);

const config: Knex.Config = {
  client: 'pg',
  connection: {
    connectionString,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
  },
  migrations: {
    directory: './src/database/migrations',
    extension: 'ts',
  },
};

export default config;
