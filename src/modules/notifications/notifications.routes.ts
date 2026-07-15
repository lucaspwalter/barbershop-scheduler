import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { NotificationsService } from './notifications.service';

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function notificationRoutes(app: FastifyInstance) {
  const notificationsService = new NotificationsService();

  app.get('/', async (_request, reply) => {
    try {
      const notifications = await notificationsService.findAll();
      return reply.send(notifications);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
