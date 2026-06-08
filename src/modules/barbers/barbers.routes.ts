import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { BarbersService } from './barbers.service';
import {
  createBarberSchema,
  deleteBarberSchema,
  getBarberSchema,
  listBarbersSchema,
  updateBarberSchema,
} from './barbers.schema';

interface IdParams {
  id: string;
}

interface ListQuery {
  includeInactive?: string;
}

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function barberRoutes(app: FastifyInstance) {
  const barbersService = new BarbersService();

  app.post('/', { schema: createBarberSchema }, async (request, reply) => {
    try {
      const barber = await barbersService.create(request.body as never);
      return reply.status(201).send(barber);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/', { schema: listBarbersSchema }, async (request, reply) => {
    try {
      const query = request.query as ListQuery;
      const barbers = await barbersService.findAll(query.includeInactive === 'true');
      return reply.send(barbers);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/:id', { schema: getBarberSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const barber = await barbersService.findById(id);
      return reply.send(barber);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.put('/:id', { schema: updateBarberSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const barber = await barbersService.update(id, request.body as never);
      return reply.send(barber);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/:id', { schema: deleteBarberSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      await barbersService.softDelete(id);
      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
