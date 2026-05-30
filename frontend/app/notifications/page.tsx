"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  client_name: string;
  phone: string;
  type: string;
  message: string;
  status: "sent" | "failed" | "pending" | string;
  sent_at: string | null;
  created_at: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotifications(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      setError(false);

      try {
        const response = await fetch(`${apiUrl}/notifications`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();
        setNotifications(data);
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

    loadNotifications(true);
    const interval = window.setInterval(() => loadNotifications(false), 10000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Notificações</h2>
        <p className="mt-1 text-sm text-gray-400">
          {notifications.length} notificações enviadas
        </p>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState /> : null}
      {!loading && !error && notifications.length === 0 ? <EmptyState /> : null}

      {!loading && !error && notifications.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-gray-800 bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-950/60">
                <tr>
                  {["Cliente", "Telefone", "Tipo", "Mensagem", "Status", "Enviado em"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                      {notification.client_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {notification.phone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {notification.type}
                    </td>
                    <td
                      className="max-w-md px-4 py-3 text-sm text-gray-300"
                      title={notification.message}
                    >
                      {truncate(notification.message, 60)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={notification.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">
                      {notification.sent_at ? formatDateTime(notification.sent_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "sent"
      ? "border-green-800 bg-green-950 text-green-300"
      : status === "failed"
        ? "border-red-800 bg-red-950 text-red-300"
        : "border-yellow-800 bg-yellow-950 text-yellow-300";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
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

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
