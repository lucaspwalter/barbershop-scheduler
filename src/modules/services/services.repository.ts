import { db } from '../../database/connection';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number | string;
  is_active: boolean;
  created_at: Date;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

const tableName = 'services';

export class ServicesRepository {
  async create(data: CreateServiceInput): Promise<Service> {
    const [service] = await db<Service>(tableName).insert(data).returning('*');
    return service;
  }

  async findAll(includeInactive = false): Promise<Service[]> {
    const query = db<Service>(tableName).select('*').orderBy('name', 'asc');

    if (!includeInactive) {
      query.where('is_active', true);
    }

    return query;
  }

  async findById(id: string): Promise<Service | undefined> {
    return db<Service>(tableName).where({ id }).first();
  }

  async update(id: string, data: UpdateServiceInput): Promise<Service | undefined> {
    const [service] = await db<Service>(tableName).where({ id }).update(data).returning('*');
    return service;
  }

  async softDelete(id: string): Promise<Service | undefined> {
    const [service] = await db<Service>(tableName)
      .where({ id })
      .update({ is_active: false })
      .returning('*');

    return service;
  }
}
