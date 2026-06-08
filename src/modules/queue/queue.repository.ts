import { db } from '../../database/connection';

export type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'done' | 'cancelled';

export interface QueueEntry {
  id: string;
  barber_id: string;
  service_id: string;
  client_id: string;
  position: number;
  estimated_wait_minutes?: number | null;
  joined_at: Date;
  status: QueueStatus;
}

export interface CreateQueueEntryInput {
  barber_id: string;
  service_id: string;
  client_id: string;
  position: number;
  estimated_wait_minutes: number;
}

export interface ActiveQueueEntryWithDuration extends QueueEntry {
  duration_minutes: number;
}

const tableName = 'waiting_queue';
const activeStatuses: QueueStatus[] = ['waiting', 'called', 'in_progress'];

export class QueueRepository {
  async create(data: CreateQueueEntryInput): Promise<QueueEntry> {
    const [entry] = await db<QueueEntry>(tableName)
      .insert({
        ...data,
        status: 'waiting',
      })
      .returning('*');

    return entry;
  }

  async findById(id: string): Promise<QueueEntry | undefined> {
    return db<QueueEntry>(tableName).where({ id }).first();
  }

  async findActiveByBarberId(barberId: string): Promise<QueueEntry[]> {
    return db<QueueEntry>(tableName)
      .where('barber_id', barberId)
      .whereIn('status', activeStatuses)
      .orderBy('position', 'asc');
  }

  async findActiveWithDurationsByBarberId(
    barberId: string,
  ): Promise<ActiveQueueEntryWithDuration[]> {
    return db(tableName)
      .join('services', 'services.id', `${tableName}.service_id`)
      .where(`${tableName}.barber_id`, barberId)
      .whereIn(`${tableName}.status`, activeStatuses)
      .select(
        `${tableName}.*`,
        'services.duration_minutes as duration_minutes',
      )
      .orderBy(`${tableName}.position`, 'asc');
  }

  async getNextPosition(barberId: string): Promise<number> {
    const result = await db(tableName)
      .where('barber_id', barberId)
      .whereIn('status', activeStatuses)
      .max<{ max?: string | number | null }>('position as max')
      .first();

    return Number(result?.max ?? 0) + 1;
  }

  async getEstimatedWaitMinutes(barberId: string): Promise<number> {
    const result = await db(tableName)
      .join('services', 'services.id', `${tableName}.service_id`)
      .where(`${tableName}.barber_id`, barberId)
      .whereIn(`${tableName}.status`, activeStatuses)
      .sum<{ total?: string | number | null }>('services.duration_minutes as total')
      .first();

    return Number(result?.total ?? 0);
  }

  async updateStatus(id: string, status: QueueStatus): Promise<QueueEntry | undefined> {
    const [entry] = await db<QueueEntry>(tableName)
      .where({ id })
      .update({ status })
      .returning('*');

    return entry;
  }

  async updateEstimatedWait(id: string, estimatedWaitMinutes: number): Promise<void> {
    await db<QueueEntry>(tableName)
      .where({ id })
      .update({ estimated_wait_minutes: estimatedWaitMinutes });
  }

  async delete(id: string): Promise<void> {
    await db<QueueEntry>(tableName).where({ id }).delete();
  }
}
