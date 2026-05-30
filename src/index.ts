import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { appointmentRoutes } from './modules/appointments/appointments.routes';
import { barberRoutes } from './modules/barbers/barbers.routes';
import { clientRoutes } from './modules/clients/clients.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { queueRoutes } from './modules/queue/queue.routes';
import { reportRoutes } from './modules/reports/reports.routes';
import { serviceRoutes } from './modules/services/services.routes';

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
});

app.get('/', async () => {
  return {
    status: 'ok',
    app: 'Barbershop Scheduler',
  };
});

app.register(barberRoutes, { prefix: '/barbers' });
app.register(clientRoutes, { prefix: '/clients' });
app.register(serviceRoutes, { prefix: '/services' });
app.register(appointmentRoutes, { prefix: '/appointments' });
app.register(queueRoutes, { prefix: '/queue' });
app.register(notificationRoutes, { prefix: '/notifications' });
app.register(reportRoutes, { prefix: '/reports' });

const start = async () => {
  try {
    await app.listen({
      port: 3333,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
