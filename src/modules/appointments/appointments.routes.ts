import type { FastifyInstance, FastifyReply } from 'fastify';
import { AppError } from '../../errors/app-error';
import { AppointmentStatus } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import {
  createAppointmentSchema,
  deleteAppointmentSchema,
  getAppointmentSchema,
  listAppointmentsSchema,
  updateAppointmentStatusSchema,
} from './appointments.schema';

interface IdParams {
  id: string;
}

interface ListQuery {
  date?: string;
  barber_id?: string;
  status?: AppointmentStatus;
}

interface StatusBody {
  status: AppointmentStatus;
}

function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Internal server error' });
}

export async function appointmentRoutes(app: FastifyInstance) {
  const appointmentsService = new AppointmentsService();

  app.post('/', { schema: createAppointmentSchema }, async (request, reply) => {
    try {
      const appointment = await appointmentsService.create(request.body as never);
      return reply.status(201).send(appointment);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/', { schema: listAppointmentsSchema }, async (request, reply) => {
    try {
      const appointments = await appointmentsService.findAll(request.query as ListQuery);
      return reply.send(appointments);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.get('/:id', { schema: getAppointmentSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const appointment = await appointmentsService.findById(id);
      return reply.send(appointment);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.patch('/:id/status', { schema: updateAppointmentStatusSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const { status } = request.body as StatusBody;
      const appointment = await appointmentsService.updateStatus(id, status);
      return reply.send(appointment);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  app.delete('/:id', { schema: deleteAppointmentSchema }, async (request, reply) => {
    try {
      const { id } = request.params as IdParams;
      const appointment = await appointmentsService.cancel(id);
      return reply.send(appointment);
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
