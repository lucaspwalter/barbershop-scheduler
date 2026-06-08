import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { ReportsService, ReportFilters } from './reports.service';

const reportQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    start_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    end_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
};

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function reportRoutes(app: FastifyInstance) {
  const reportsService = new ReportsService();

  app.get('/revenue', { schema: { querystring: reportQuerySchema } }, async (request, reply) => {
    try {
      const report = await reportsService.getRevenue(request.query as ReportFilters);
      return reply.send(report);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get(
    '/appointments',
    { schema: { querystring: reportQuerySchema } },
    async (request, reply) => {
      try {
        const report = await reportsService.getAppointments(request.query as ReportFilters);
        return reply.send(report);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );

  app.get('/barbers', { schema: { querystring: reportQuerySchema } }, async (request, reply) => {
    try {
      const report = await reportsService.getBarbers(request.query as ReportFilters);
      return reply.send(report);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get(
    '/peak-hours',
    { schema: { querystring: reportQuerySchema } },
    async (request, reply) => {
      try {
        const report = await reportsService.getPeakHours(request.query as ReportFilters);
        return reply.send(report);
      } catch (error) {
        return handleRouteError(error, reply);
      }
    },
  );
}
