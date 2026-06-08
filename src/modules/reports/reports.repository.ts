import { db } from '../../database/connection';

export interface ReportPeriod {
  startDate: Date;
  endDateExclusive: Date;
}

interface CountRow {
  count: string | number;
}

interface RevenueRow extends CountRow {
  revenue: string | number | null;
}

export interface RevenueGroupRow extends RevenueRow {
  name: string;
}

export interface AppointmentStatusRow extends CountRow {
  status: string;
}

export interface BarberPerformanceRow {
  barber_id: string;
  barber_name: string;
  completed: string | number;
  cancelled: string | number;
  no_show: string | number;
  revenue: string | number | null;
}

export interface MostRequestedServiceRow {
  barber_id: string;
  service_name: string;
  count: string | number;
}

export interface PeakHourRow extends CountRow {
  hour: string | number;
}

export interface PeakWeekdayRow extends CountRow {
  weekday: string | number;
}

export class ReportsRepository {
  async getRevenueSummary(period: ReportPeriod): Promise<RevenueRow> {
    const row = await db('appointments')
      .join('services', 'services.id', 'appointments.service_id')
      .where('appointments.status', 'completed')
      .where('appointments.starts_at', '>=', period.startDate)
      .where('appointments.starts_at', '<', period.endDateExclusive)
      .select(db.raw('COUNT(*) as count'), db.raw('COALESCE(SUM(services.price), 0) as revenue'))
      .first<RevenueRow>();

    return row ?? { count: 0, revenue: 0 };
  }

  async getRevenueByService(period: ReportPeriod): Promise<RevenueGroupRow[]> {
    return db('appointments')
      .join('services', 'services.id', 'appointments.service_id')
      .where('appointments.status', 'completed')
      .where('appointments.starts_at', '>=', period.startDate)
      .where('appointments.starts_at', '<', period.endDateExclusive)
      .groupBy('services.name')
      .select(
        'services.name as name',
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(services.price), 0) as revenue'),
      )
      .orderBy('count', 'desc');
  }

  async getRevenueByBarber(period: ReportPeriod): Promise<RevenueGroupRow[]> {
    return db('appointments')
      .join('services', 'services.id', 'appointments.service_id')
      .join('barbers', 'barbers.id', 'appointments.barber_id')
      .where('appointments.status', 'completed')
      .where('appointments.starts_at', '>=', period.startDate)
      .where('appointments.starts_at', '<', period.endDateExclusive)
      .groupBy('barbers.name')
      .select(
        'barbers.name as name',
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(services.price), 0) as revenue'),
      )
      .orderBy('count', 'desc');
  }

  async getAppointmentsByStatus(period: ReportPeriod): Promise<AppointmentStatusRow[]> {
    return db('appointments')
      .where('starts_at', '>=', period.startDate)
      .where('starts_at', '<', period.endDateExclusive)
      .groupBy('status')
      .select('status', db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc');
  }

  async getBarberPerformance(period: ReportPeriod): Promise<BarberPerformanceRow[]> {
    return db('barbers')
      .leftJoin('appointments', function joinAppointments() {
        this.on('appointments.barber_id', '=', 'barbers.id')
          .andOn('appointments.starts_at', '>=', db.raw('?', [period.startDate]))
          .andOn('appointments.starts_at', '<', db.raw('?', [period.endDateExclusive]));
      })
      .leftJoin('services', 'services.id', 'appointments.service_id')
      .groupBy('barbers.id', 'barbers.name')
      .select(
        'barbers.id as barber_id',
        'barbers.name as barber_name',
        db.raw("COUNT(*) FILTER (WHERE appointments.status = 'completed') as completed"),
        db.raw("COUNT(*) FILTER (WHERE appointments.status = 'cancelled') as cancelled"),
        db.raw("COUNT(*) FILTER (WHERE appointments.status = 'no_show') as no_show"),
        db.raw(
          "COALESCE(SUM(services.price) FILTER (WHERE appointments.status = 'completed'), 0) as revenue",
        ),
      )
      .orderBy('completed', 'desc');
  }

  async getMostRequestedServices(period: ReportPeriod): Promise<MostRequestedServiceRow[]> {
    return db
      .select('barber_id', 'service_name', 'count')
      .from(
        db('appointments')
          .join('services', 'services.id', 'appointments.service_id')
          .where('appointments.status', 'completed')
          .where('appointments.starts_at', '>=', period.startDate)
          .where('appointments.starts_at', '<', period.endDateExclusive)
          .groupBy('appointments.barber_id', 'services.name')
          .select(
            'appointments.barber_id',
            'services.name as service_name',
            db.raw('COUNT(*) as count'),
            db.raw(
              'ROW_NUMBER() OVER (PARTITION BY appointments.barber_id ORDER BY COUNT(*) DESC, services.name ASC) as rank',
            ),
          )
          .as('ranked_services'),
      )
      .where('rank', 1);
  }

  async getPeakHours(period: ReportPeriod): Promise<PeakHourRow[]> {
    return db('appointments')
      .whereNot('status', 'cancelled')
      .where('starts_at', '>=', period.startDate)
      .where('starts_at', '<', period.endDateExclusive)
      .groupByRaw('EXTRACT(HOUR FROM starts_at)')
      .select(db.raw('EXTRACT(HOUR FROM starts_at)::int as hour'), db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc');
  }

  async getPeakWeekdays(period: ReportPeriod): Promise<PeakWeekdayRow[]> {
    return db('appointments')
      .whereNot('status', 'cancelled')
      .where('starts_at', '>=', period.startDate)
      .where('starts_at', '<', period.endDateExclusive)
      .groupByRaw('EXTRACT(DOW FROM starts_at)')
      .select(db.raw('EXTRACT(DOW FROM starts_at)::int as weekday'), db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc');
  }
}
