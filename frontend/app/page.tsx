"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueReport = {
  total_revenue: number;
  total_appointments: number;
  average_ticket: number;
  by_service: { service_name: string; count: number; revenue: number }[];
};

type AppointmentsReport = {
  total: number;
  by_status: { status: string; count: number; percentage: number }[];
  no_show_rate: number;
};

type PeakHoursReport = {
  by_hour: { hour: number; count: number }[];
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
const pieColors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

export default function DashboardPage() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [filters, setFilters] = useState(defaultRange);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [appointments, setAppointments] = useState<AppointmentsReport | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      setError(false);

      try {
        const params = new URLSearchParams({
          start_date: filters.start,
          end_date: filters.end,
        });
        const [revenueResponse, appointmentsResponse, peakHoursResponse] = await Promise.all([
          fetch(`${apiUrl}/reports/revenue?${params}`, { signal: controller.signal }),
          fetch(`${apiUrl}/reports/appointments?${params}`, { signal: controller.signal }),
          fetch(`${apiUrl}/reports/peak-hours?${params}`, { signal: controller.signal }),
        ]);

        if (!revenueResponse.ok || !appointmentsResponse.ok || !peakHoursResponse.ok) {
          throw new Error("Failed to fetch reports");
        }

        const [revenueData, appointmentsData, peakHoursData] = await Promise.all([
          revenueResponse.json(),
          appointmentsResponse.json(),
          peakHoursResponse.json(),
        ]);

        setRevenue(revenueData);
        setAppointments(appointmentsData);
        setPeakHours(peakHoursData);
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => controller.abort();
  }, [filters]);

  const hasData =
    Boolean(revenue?.total_appointments) ||
    Boolean(appointments?.total) ||
    Boolean(peakHours?.by_hour.length);

  function applyFilters() {
    setFilters({ start: startDate, end: endDate });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-400">Relatórios de receita, agenda e demanda.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-gray-800 bg-gray-900 p-3 sm:flex-row sm:items-end">
          <label className="text-sm text-gray-400">
            Início
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block h-10 rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>
          <label className="text-sm text-gray-400">
            Fim
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 block h-10 rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </label>
          <button
            type="button"
            onClick={applyFilters}
            className="h-10 rounded-md bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Filtrar
          </button>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState /> : null}
      {!loading && !error && !hasData ? <EmptyState /> : null}

      {!loading && !error && hasData ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Receita total" value={formatCurrency(revenue?.total_revenue ?? 0)} />
            <SummaryCard
              label="Agendamentos completados"
              value={String(revenue?.total_appointments ?? 0)}
            />
            <SummaryCard label="Ticket médio" value={formatCurrency(revenue?.average_ticket ?? 0)} />
            <SummaryCard label="Taxa de no-show" value={`${appointments?.no_show_rate ?? 0}%`} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Receita por serviço">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={revenue?.by_service ?? []} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" tickFormatter={(value) => `R$ ${value}`} />
                  <YAxis
                    type="category"
                    dataKey="service_name"
                    stroke="#9ca3af"
                    width={120}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#111827" }}
                    contentStyle={{ background: "#111827", border: "1px solid #374151" }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status dos agendamentos">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={appointments?.by_status ?? []}
                    dataKey="percentage"
                    nameKey="status"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {(appointments?.by_status ?? []).map((entry, index) => (
                      <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151" }}
                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(appointments?.by_status ?? []).map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-300">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      {item.status}
                    </span>
                    <span className="text-gray-400">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </section>

          <ChartCard title="Horários de pico">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={peakHours?.by_hour ?? []}>
                <CartesianGrid stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#9ca3af" tickFormatter={(value) => `${value}h`} />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#111827" }}
                  contentStyle={{ background: "#111827", border: "1px solid #374151" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-gray-800 bg-gray-900 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-md border border-gray-800 bg-gray-900">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-md border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
      Não foi possível carregar os dados. Verifique se o servidor está rodando.
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
      Nenhum dado encontrado para o período.
    </div>
  );
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  return {
    start: formatInputDate(start),
    end: formatInputDate(end),
  };
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
