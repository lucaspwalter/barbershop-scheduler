import { AppError } from '../../errors/app-error';
import {
  BarberPerformanceRow,
  ReportsRepository,
  ReportPeriod,
} from './reports.repository';

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
}

const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export class ReportsService {
  constructor(private readonly reportsRepository = new ReportsRepository()) {}

  async getRevenue(filters: ReportFilters) {
    const period = parsePeriod(filters);
    const [summary, byService, byBarber] = await Promise.all([
      this.reportsRepository.getRevenueSummary(period),
      this.reportsRepository.getRevenueByService(period),
      this.reportsRepository.getRevenueByBarber(period),
    ]);

    const totalAppointments = toInteger(summary.count);
    const totalRevenue = toMoney(summary.revenue);

    return {
      period: formatPeriod(period),
      total_revenue: totalRevenue,
      total_appointments: totalAppointments,
      average_ticket: totalAppointments > 0 ? toMoney(totalRevenue / totalAppointments) : 0,
      by_service: byService.map((item) => ({
        service_name: item.name,
        count: toInteger(item.count),
        revenue: toMoney(item.revenue),
      })),
      by_barber: byBarber.map((item) => ({
        barber_name: item.name,
        count: toInteger(item.count),
        revenue: toMoney(item.revenue),
      })),
    };
  }

  async getAppointments(filters: ReportFilters) {
    const period = parsePeriod(filters);
    const rows = await this.reportsRepository.getAppointmentsByStatus(period);
    const total = rows.reduce((sum, row) => sum + toInteger(row.count), 0);
    const countByStatus = new Map(rows.map((row) => [row.status, toInteger(row.count)]));

    return {
      period: formatPeriod(period),
      total,
      by_status: rows.map((row) => {
        const count = toInteger(row.count);

        return {
          status: row.status,
          count,
          percentage: total > 0 ? toMoney((count / total) * 100) : 0,
        };
      }),
      no_show_rate: total > 0 ? toMoney(((countByStatus.get('no_show') ?? 0) / total) * 100) : 0,
      cancellation_rate:
        total > 0 ? toMoney(((countByStatus.get('cancelled') ?? 0) / total) * 100) : 0,
    };
  }

  async getBarbers(filters: ReportFilters) {
    const period = parsePeriod(filters);
    const [performanceRows, mostRequestedRows] = await Promise.all([
      this.reportsRepository.getBarberPerformance(period),
      this.reportsRepository.getMostRequestedServices(period),
    ]);
    const mostRequestedByBarber = new Map(
      mostRequestedRows.map((row) => [row.barber_id, row.service_name]),
    );

    return performanceRows.map((row: BarberPerformanceRow) => {
      const completed = toInteger(row.completed);
      const revenue = toMoney(row.revenue);

      return {
        barber_id: row.barber_id,
        barber_name: row.barber_name,
        completed,
        cancelled: toInteger(row.cancelled),
        no_show: toInteger(row.no_show),
        revenue,
        average_ticket: completed > 0 ? toMoney(revenue / completed) : 0,
        most_requested_service: mostRequestedByBarber.get(row.barber_id) ?? '',
      };
    });
  }

  async getPeakHours(filters: ReportFilters) {
    const period = parsePeriod(filters);
    const [byHour, byWeekday] = await Promise.all([
      this.reportsRepository.getPeakHours(period),
      this.reportsRepository.getPeakWeekdays(period),
    ]);

    return {
      period: formatPeriod(period),
      by_hour: byHour.map((row) => ({
        hour: toInteger(row.hour),
        count: toInteger(row.count),
      })),
      by_weekday: byWeekday.map((row) => {
        const weekday = toInteger(row.weekday);

        return {
          weekday,
          weekday_name: weekdayNames[weekday] ?? '',
          count: toInteger(row.count),
        };
      }),
    };
  }
}

function parsePeriod(filters: ReportFilters): ReportPeriod {
  const end = filters.end_date ? parseDate(filters.end_date, 'end_date') : startOfToday();
  const start = filters.start_date ? parseDate(filters.start_date, 'start_date') : addDays(end, -29);

  if (start > end) {
    throw new AppError('start_date cannot be after end_date', 400);
  }

  return {
    startDate: start,
    endDateExclusive: addDays(end, 1),
  };
}

function parseDate(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`${field} must be in YYYY-MM-DD format`, 400);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  return date;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function formatPeriod(period: ReportPeriod) {
  return {
    start: formatDate(period.startDate),
    end: formatDate(addDays(period.endDateExclusive, -1)),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toInteger(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function toMoney(value: string | number | null | undefined): number {
  return Number(Number(value ?? 0).toFixed(2));
}
