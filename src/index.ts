import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { barberRoutes } from './modules/barbers/barbers.routes';
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
app.register(serviceRoutes, { prefix: '/services' });

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
