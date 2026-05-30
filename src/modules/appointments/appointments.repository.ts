import { db } from '../../database/connection';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  barber_id: string;
  service_id: string;
  client_id: string;
  starts_at: Date;
  ends_at: Date;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: Date;
}

export interface CreateAppointmentInput {
  barber_id: string;
  service_id: string;
  client_id: string;
  starts_at: Date;
  ends_at: Date;
}

export interface AppointmentFilters {
  date?: string;
  barber_id?: string;
  status?: AppointmentStatus;
}

const tableName = 'appointments';

export class AppointmentsRepository {
  async create(data: CreateAppointmentInput): Promise<Appointment> {
    const [appointment] = await db<Appointment>(tableName).insert(data).returning('*');
    return appointment;
  }

  async findAll(filters: AppointmentFilters): Promise<Appointment[]> {
    const query = db<Appointment>(tableName).select('*').orderBy('starts_at', 'asc');

    if (filters.barber_id) {
      query.where('barber_id', filters.barber_id);
    }

    if (filters.status) {
      query.where('status', filters.status);
    }

    if (filters.date) {
      const startOfDay = new Date(`${filters.date}T00:00:00.000Z`);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      query.where('starts_at', '>=', startOfDay).where('starts_at', '<', endOfDay);
    }

    return query;
  }

  async findById(id: string): Promise<Appointment | undefined> {
    return db<Appointment>(tableName).where({ id }).first();
  }

  async findConflict(
    barberId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment | undefined> {
    return db<Appointment>(tableName)
      .where('barber_id', barberId)
      .whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
      .where('starts_at', '<', endsAt)
      .where('ends_at', '>', startsAt)
      .first();
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | undefined> {
    const [appointment] = await db<Appointment>(tableName)
      .where({ id })
      .update({ status })
      .returning('*');

    return appointment;
  }
}
