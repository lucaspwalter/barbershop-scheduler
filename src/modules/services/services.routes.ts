import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { ServicesService } from './services.service';
import {
  createServiceSchema,
  deleteServiceSchema,
  getServiceSchema,
  listServicesSchema,
  updateServiceSchema,
} from './services.schema';

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

export async function serviceRoutes(app: FastifyInstance) {
  const servicesService = new ServicesService();

  app.post('/', { schema: createServiceSchema }, async (request, reply) => {
    try {
      const service = await servicesService.create(request.body as never);
      return reply.status(201).send(service);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/', { schema: listServicesSchema }, async (request, reply) => {
    try {
      const query = request.query as ListQuery;
      const services = await servicesService.findAll(query.includeInactive === 'true');
      return reply.send(services);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/:id', { schema: getServiceSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const service = await servicesService.findById(id);
      return reply.send(service);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.put('/:id', { schema: updateServiceSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const service = await servicesService.update(id, request.body as never);
      return reply.send(service);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/:id', { schema: deleteServiceSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      await servicesService.softDelete(id);
      return reply.status(204).send();
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
