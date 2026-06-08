import { AppError } from '../../errors/app-error';
import { BarbersRepository } from '../barbers/barbers.repository';
import { ClientsRepository } from '../clients/clients.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ServicesRepository } from '../services/services.repository';
import { QueueRepository, QueueStatus } from './queue.repository';

export interface CreateQueueEntryRequest {
  barber_id: string;
  service_id: string;
  client_id: string;
}

const validTransitions: Record<QueueStatus, QueueStatus[]> = {
  waiting: ['called', 'cancelled'],
  called: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export class QueueService {
  constructor(
    private readonly queueRepository = new QueueRepository(),
    private readonly barbersRepository = new BarbersRepository(),
    private readonly servicesRepository = new ServicesRepository(),
    private readonly clientsRepository = new ClientsRepository(),
    private readonly notificationsService = new NotificationsService(),
  ) {}

  async create(data: CreateQueueEntryRequest) {
    const [barber, service, client] = await Promise.all([
      this.barbersRepository.findById(data.barber_id),
      this.servicesRepository.findById(data.service_id),
      this.clientsRepository.findById(data.client_id),
    ]);

    if (!barber) {
      throw new AppError('Barber not found', 404);
    }

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const [position, estimatedWaitMinutes] = await Promise.all([
      this.queueRepository.getNextPosition(data.barber_id),
      this.queueRepository.getEstimatedWaitMinutes(data.barber_id),
    ]);

    return this.queueRepository.create({
      ...data,
      position,
      estimated_wait_minutes: estimatedWaitMinutes,
    });
  }

  async findActiveByBarberId(barberId: string) {
    return this.queueRepository.findActiveByBarberId(barberId);
  }

  async updateStatus(id: string, nextStatus: QueueStatus) {
    const entry = await this.findById(id);
    const allowedStatuses = validTransitions[entry.status];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new AppError(`Invalid queue status transition from ${entry.status} to ${nextStatus}`, 422);
    }

    const updatedEntry = await this.queueRepository.updateStatus(id, nextStatus);
    await this.recalculateWaitingEstimates(entry.barber_id);

    if (nextStatus === 'called') {
      const client = await this.clientsRepository.findById(entry.client_id);

      if (client) {
        await this.notificationsService.send({
          client_id: client.id,
          phone: client.phone,
          type: 'queue_called',
          message: `Olá ${client.name}! É a sua vez. Por favor, dirija-se ao barbeiro.`,
        });
      }
    }

    return updatedEntry;
  }

  async delete(id: string) {
    const entry = await this.findById(id);
    await this.queueRepository.delete(id);
    await this.recalculateWaitingEstimates(entry.barber_id);
  }

  private async findById(id: string) {
    const entry = await this.queueRepository.findById(id);

    if (!entry) {
      throw new AppError('Queue entry not found', 404);
    }

    return entry;
  }

  private async recalculateWaitingEstimates(barberId: string): Promise<void> {
    const activeEntries = await this.queueRepository.findActiveWithDurationsByBarberId(barberId);
    let accumulatedMinutes = 0;

    for (const entry of activeEntries) {
      if (entry.status === 'waiting') {
        await this.queueRepository.updateEstimatedWait(entry.id, accumulatedMinutes);
      }

      accumulatedMinutes += entry.duration_minutes;
    }
  }
}
