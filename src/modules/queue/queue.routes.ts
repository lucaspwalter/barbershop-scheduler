import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { QueueStatus } from './queue.repository';
import { QueueService } from './queue.service';
import {
  createQueueEntrySchema,
  deleteQueueEntrySchema,
  listQueueByBarberSchema,
  updateQueueStatusSchema,
} from './queue.schema';

interface IdParams {
  id: string;
}

interface BarberParams {
  barber_id: string;
}

interface StatusBody {
  status: QueueStatus;
}

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function queueRoutes(app: FastifyInstance) {
  const queueService = new QueueService();

  app.post('/', { schema: createQueueEntrySchema }, async (request, reply) => {
    try {
      const entry = await queueService.create(request.body as never);
      return reply.status(201).send(entry);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/barber/:barber_id', { schema: listQueueByBarberSchema }, async (request, reply) => {
    try {
      const { barber_id } = request.params as BarberParams;
      const entries = await queueService.findActiveByBarberId(barber_id);
      return reply.send(entries);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.patch('/:id/status', { schema: updateQueueStatusSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const { status } = request.body as StatusBody;
      const entry = await queueService.updateStatus(id, status);
      return reply.send(entry);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/:id', { schema: deleteQueueEntrySchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      await queueService.delete(id);
      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
