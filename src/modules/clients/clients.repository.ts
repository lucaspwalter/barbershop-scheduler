import { db } from '../../database/connection';

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  created_at: Date;
}

export interface CreateClientInput {
  name: string;
  phone: string;
  email?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

const tableName = 'clients';

export class ClientsRepository {
  async create(data: CreateClientInput): Promise<Client> {
    const [client] = await db<Client>(tableName).insert(data).returning('*');
    return client;
  }

  async findAll(): Promise<Client[]> {
    return db<Client>(tableName).select('*').orderBy('name', 'asc');
  }

  async findById(id: string): Promise<Client | undefined> {
    return db<Client>(tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<Client | undefined> {
    return db<Client>(tableName).where({ email }).first();
  }

  async findByEmailExceptId(email: string, id: string): Promise<Client | undefined> {
    return db<Client>(tableName).where({ email }).whereNot({ id }).first();
  }

  async hasFutureAppointments(id: string): Promise<boolean> {
    const appointment = await db('appointments')
      .where({ client_id: id })
      .whereIn('status', ['scheduled', 'confirmed'])
      .where('starts_at', '>=', db.fn.now())
      .first('id');

    return Boolean(appointment);
  }

  async update(id: string, data: UpdateClientInput): Promise<Client | undefined> {
    const [client] = await db<Client>(tableName).where({ id }).update(data).returning('*');
    return client;
  }

  async delete(id: string): Promise<void> {
    await db<Client>(tableName).where({ id }).delete();
  }
}
