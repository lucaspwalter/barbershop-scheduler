import { db } from './src/database/connection';

const API_URL = 'http://localhost:3333';

type Barber = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | string;
};

type Client = {
  id: string;
  name: string;
  phone: string;
};

type Appointment = {
  id: string;
  status: AppointmentStatus;
};

type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

const barberSeeds = [
  { name: 'João Silva', email: 'joao@barbearia.com', phone: '47999990001' },
  { name: 'Pedro Oliveira', email: 'pedro@barbearia.com', phone: '47999990002' },
  { name: 'Rafael Costa', email: 'rafael@barbearia.com', phone: '47999990003' },
];

const serviceSeeds = [
  { name: 'Corte Masculino', duration_minutes: 30, price: 45, weight: 50 },
  { name: 'Barba', duration_minutes: 15, price: 25, weight: 20 },
  { name: 'Corte + Barba', duration_minutes: 45, price: 65, weight: 30 },
];

const clientSeeds = [
  { name: 'Carlos Souza', phone: '47988880001' },
  { name: 'Marcos Lima', phone: '47988880002' },
  { name: 'Bruno Alves', phone: '47988880003' },
  { name: 'Lucas Ferreira', phone: '47988880004' },
  { name: 'Thiago Mendes', phone: '47988880005' },
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function ensureBarbers(): Promise<Barber[]> {
  console.log('Buscando barbeiros existentes...');
  const existingBarbers = await get<Barber[]>('/barbers?includeInactive=true');
  const barbers = [...existingBarbers];

  for (const barberSeed of barberSeeds) {
    const existingBarber = barbers.find((barber) => barber.email === barberSeed.email);

    if (existingBarber) {
      console.log(`Barbeiro reutilizado: ${existingBarber.name}`);
      continue;
    }

    const barber = await post<Barber>('/barbers', barberSeed);
    console.log(`Barbeiro criado: ${barber.name}`);
    barbers.push(barber);
  }

  return barberSeeds.map((seed) => findRequired(barbers, (barber) => barber.email === seed.email, seed.name));
}

async function ensureServices(): Promise<Service[]> {
  console.log('Buscando serviços existentes...');
  const existingServices = await get<Service[]>('/services?includeInactive=true');
  const services = [...existingServices];

  for (const serviceSeed of serviceSeeds) {
    const existingService = services.find((service) => service.name === serviceSeed.name);

    if (existingService) {
      console.log(`Serviço reutilizado: ${existingService.name}`);
      continue;
    }

    const service = await post<Service>('/services', {
      name: serviceSeed.name,
      duration_minutes: serviceSeed.duration_minutes,
      price: serviceSeed.price,
    });
    console.log(`Serviço criado: ${service.name}`);
    services.push(service);
  }

  return serviceSeeds.map((seed) => findRequired(services, (service) => service.name === seed.name, seed.name));
}

async function ensureClients(): Promise<Client[]> {
  console.log('Buscando clientes existentes...');
  const existingClients = await get<Client[]>('/clients');
  const clients = [...existingClients];

  for (const clientSeed of clientSeeds) {
    const existingClient = clients.find((client) => client.phone === clientSeed.phone);

    if (existingClient) {
      console.log(`Cliente reutilizado: ${existingClient.name}`);
      continue;
    }

    const client = await post<Client>('/clients', clientSeed);
    console.log(`Cliente criado: ${client.name}`);
    clients.push(client);
  }

  return clientSeeds.map((seed) => findRequired(clients, (client) => client.phone === seed.phone, seed.name));
}

async function cleanTransactionalTables(): Promise<void> {
  console.log('Limpando appointments, waiting_queue e notifications...');
  await db.raw('TRUNCATE TABLE notifications, waiting_queue, appointments RESTART IDENTITY CASCADE');
  console.log('Tabelas transacionais limpas.');
}

async function cleanNotifications(): Promise<void> {
  console.log('Limpando notifications...');
  await db.raw('DELETE FROM notifications');
  console.log('Tabela notifications limpa.');
}

async function createAppointments(
  barbers: Barber[],
  services: Service[],
  clients: Client[],
): Promise<Record<AppointmentStatus, number>> {
  console.log('Gerando agendamentos de maio e junho de 2026...');

  const totals = createStatusTotals();
  let totalAppointments = 0;

  for (const day of getDaysBetween('2026-05-01', '2026-06-30')) {
    if (!isBusinessDay(day)) {
      continue;
    }

    for (const barber of barbers) {
      const appointmentsTarget = randomInt(4, 6);
      let startsAtUtc = createUtcDateAtLocalHour(day, 9);
      const localEndUtc = createUtcDateAtLocalHour(day, 18);
      let createdForBarber = 0;

      while (createdForBarber < appointmentsTarget && startsAtUtc < localEndUtc) {
        const service = pickWeightedService(services);
        const endsAtUtc = addMinutes(startsAtUtc, service.duration_minutes);

        if (endsAtUtc > localEndUtc) {
          break;
        }

        const client = pickRandom(clients);
        const appointment = await post<Appointment>('/appointments', {
          barber_id: barber.id,
          service_id: service.id,
          client_id: client.id,
          starts_at: startsAtUtc.toISOString(),
        });
        const finalStatus = pickStatus(day);

        await applyFinalStatus(appointment, finalStatus);
        totals[finalStatus] += 1;
        totalAppointments += 1;
        createdForBarber += 1;

        console.log(
          `Agendamento criado: ${formatDate(day)} ${formatTime(startsAtUtc)} ${barber.name} / ${service.name} / ${client.name} -> ${finalStatus}`,
        );

        startsAtUtc = addMinutes(endsAtUtc, 10);
      }
    }
  }

  console.log(`Total de agendamentos criados: ${totalAppointments}`);
  console.log('Total por status:');

  for (const [status, count] of Object.entries(totals)) {
    console.log(`- ${status}: ${count}`);
  }

  return totals;
}

async function applyFinalStatus(appointment: Appointment, finalStatus: AppointmentStatus): Promise<void> {
  const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    scheduled: [],
    confirmed: ['confirmed'],
    in_progress: ['confirmed', 'in_progress'],
    completed: ['confirmed', 'in_progress', 'completed'],
    cancelled: ['cancelled'],
    no_show: ['confirmed', 'in_progress', 'no_show'],
  };

  for (const status of transitions[finalStatus]) {
    await patch<Appointment>(`/appointments/${appointment.id}/status`, { status });
  }
}

async function addQueueEntries(barbers: Barber[], services: Service[], clients: Client[]): Promise<void> {
  console.log('Adicionando Carlos e Lucas à fila do João...');
  const joao = findRequired(barbers, (barber) => barber.name === 'João Silva', 'João Silva');
  const corte = findRequired(services, (service) => service.name === 'Corte Masculino', 'Corte Masculino');
  const carlos = findRequired(clients, (client) => client.name === 'Carlos Souza', 'Carlos Souza');
  const lucas = findRequired(clients, (client) => client.name === 'Lucas Ferreira', 'Lucas Ferreira');

  for (const client of [carlos, lucas]) {
    await post('/queue', {
      barber_id: joao.id,
      service_id: corte.id,
      client_id: client.id,
    });
    console.log(`Cliente adicionado à fila: ${client.name}`);
  }
}

function pickStatus(day: Date): AppointmentStatus {
  const cutoff = new Date('2026-05-30T23:59:59.999Z');
  const value = Math.random() * 100;

  if (day <= cutoff) {
    if (value < 70) {
      return 'completed';
    }

    if (value < 85) {
      return 'no_show';
    }

    return 'cancelled';
  }

  return value < 60 ? 'confirmed' : 'scheduled';
}

function pickWeightedService(services: Service[]): Service {
  const weightedServices = serviceSeeds.map((seed) => ({
    service: findRequired(services, (service) => service.name === seed.name, seed.name),
    weight: seed.weight,
  }));
  const totalWeight = weightedServices.reduce((sum, item) => sum + item.weight, 0);
  let value = Math.random() * totalWeight;

  for (const item of weightedServices) {
    value -= item.weight;

    if (value <= 0) {
      return item.service;
    }
  }

  return weightedServices[weightedServices.length - 1].service;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDaysBetween(start: string, end: string): Date[] {
  const days: Date[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

function isBusinessDay(day: Date): boolean {
  const weekday = day.getUTCDay();
  return weekday >= 1 && weekday <= 6;
}

function createUtcDateAtLocalHour(day: Date, localHour: number): Date {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), localHour + 3, 0, 0, 0),
  );
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function createStatusTotals(): Record<AppointmentStatus, number> {
  return {
    scheduled: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
}

function findRequired<T>(items: T[], predicate: (item: T) => boolean, label: string): T {
  const item = items.find(predicate);

  if (!item) {
    throw new Error(`Item obrigatório não encontrado: ${label}`);
  }

  return item;
}

async function main(): Promise<void> {
  console.log('Iniciando seed do Barbershop Scheduler...');
  console.log('Confirme que o servidor foi reiniciado com SKIP_DATE_VALIDATION=true.');

  const barbers = await ensureBarbers();
  const services = await ensureServices();
  const clients = await ensureClients();

  await cleanTransactionalTables();
  await createAppointments(barbers, services, clients);
  await addQueueEntries(barbers, services, clients);
  await cleanNotifications();
  await db.destroy();

  console.log('Seed finalizado com sucesso.');
}

main().catch(async (error) => {
  console.error('Erro ao executar seed:', error);
  await db.destroy();
  process.exit(1);
});
