import { db } from '../../database/connection';

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface CreateBarberInput {
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export type UpdateBarberInput = Partial<CreateBarberInput>;

const tableName = 'barbers';

export class BarbersRepository {
  async create(data: CreateBarberInput): Promise<Barber> {
    const [barber] = await db<Barber>(tableName).insert(data).returning('*');
    return barber;
  }

  async findAll(includeInactive = false): Promise<Barber[]> {
    const query = db<Barber>(tableName).select('*').orderBy('name', 'asc');

    if (!includeInactive) {
      query.where('is_active', true);
    }

    return query;
  }

  async findById(id: string): Promise<Barber | undefined> {
    return db<Barber>(tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<Barber | undefined> {
    return db<Barber>(tableName).where({ email }).first();
  }

  async findByEmailExceptId(email: string, id: string): Promise<Barber | undefined> {
    return db<Barber>(tableName).where({ email }).whereNot({ id }).first();
  }

  async update(id: string, data: UpdateBarberInput): Promise<Barber | undefined> {
    const [barber] = await db<Barber>(tableName).where({ id }).update(data).returning('*');
    return barber;
  }

  async softDelete(id: string): Promise<Barber | undefined> {
    const [barber] = await db<Barber>(tableName)
      .where({ id })
      .update({ is_active: false })
      .returning('*');

    return barber;
  }
}
