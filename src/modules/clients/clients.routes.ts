import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { ClientsService } from './clients.service';
import {
  createClientSchema,
  deleteClientSchema,
  getClientSchema,
  updateClientSchema,
} from './clients.schema';

interface IdParams {
  id: string;
}

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function clientRoutes(app: FastifyInstance) {
  const clientsService = new ClientsService();

  app.post('/', { schema: createClientSchema }, async (request, reply) => {
    try {
      const client = await clientsService.create(request.body as never);
      return reply.status(201).send(client);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/', async (_request, reply) => {
    try {
      const clients = await clientsService.findAll();
      return reply.send(clients);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/:id', { schema: getClientSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const client = await clientsService.findById(id);
      return reply.send(client);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.put('/:id', { schema: updateClientSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const client = await clientsService.update(id, request.body as never);
      return reply.send(client);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/:id', { schema: deleteClientSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      await clientsService.delete(id);
      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
