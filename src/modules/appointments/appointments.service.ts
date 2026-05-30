import { AppError } from '../../errors/app-error';
import { BarbersRepository } from '../barbers/barbers.repository';
import { ClientsRepository } from '../clients/clients.repository';
import { ServicesRepository } from '../services/services.repository';
import {
  AppointmentStatus,
  AppointmentsRepository,
  AppointmentFilters,
} from './appointments.repository';

export interface CreateAppointmentRequest {
  barber_id: string;
  service_id: string;
  client_id: string;
  starts_at: string;
}

const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository = new AppointmentsRepository(),
    private readonly barbersRepository = new BarbersRepository(),
    private readonly servicesRepository = new ServicesRepository(),
    private readonly clientsRepository = new ClientsRepository(),
  ) {}

  async create(data: CreateAppointmentRequest) {
    const startsAt = new Date(data.starts_at);

    if (Number.isNaN(startsAt.getTime())) {
      throw new AppError('starts_at must be a valid ISO 8601 date', 400);
    }

    if (startsAt <= new Date()) {
      throw new AppError('starts_at cannot be in the past', 400);
    }

    const [barber, service, client] = await Promise.all([
      this.barbersRepository.findById(data.barber_id),
      this.servicesRepository.findById(data.service_id),
      this.clientsRepository.findById(data.client_id),
    ]);

    if (!barber || !barber.is_active) {
      throw new AppError('Active barber not found', 404);
    }

    if (!service || !service.is_active) {
      throw new AppError('Active service not found', 404);
    }

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60 * 1000);
    const conflict = await this.appointmentsRepository.findConflict(
      data.barber_id,
      startsAt,
      endsAt,
    );

    if (conflict) {
      throw new AppError(
        `Barber unavailable: conflict with appointment ${conflict.id} from ${new Date(
          conflict.starts_at,
        ).toISOString()} to ${new Date(conflict.ends_at).toISOString()}`,
        409,
      );
    }

    return this.appointmentsRepository.create({
      barber_id: data.barber_id,
      service_id: data.service_id,
      client_id: data.client_id,
      starts_at: startsAt,
      ends_at: endsAt,
    });
  }

  async findAll(filters: AppointmentFilters) {
    return this.appointmentsRepository.findAll(filters);
  }

  async findById(id: string) {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return appointment;
  }

  async updateStatus(id: string, nextStatus: AppointmentStatus) {
    const appointment = await this.findById(id);
    const allowedStatuses = validTransitions[appointment.status];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new AppError(
        `Invalid status transition from ${appointment.status} to ${nextStatus}`,
        422,
      );
    }

    return this.appointmentsRepository.updateStatus(id, nextStatus);
  }

  async cancel(id: string) {
    const appointment = await this.findById(id);

    if (appointment.status === 'cancelled') {
      return appointment;
    }

    if (!validTransitions[appointment.status].includes('cancelled')) {
      throw new AppError(`Appointment with status ${appointment.status} cannot be cancelled`, 422);
    }

    return this.appointmentsRepository.updateStatus(id, 'cancelled');
  }
}
