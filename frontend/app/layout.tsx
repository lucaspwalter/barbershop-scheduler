import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barbershop Scheduler",
  description: "Business dashboard for barbershop scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-950 text-white">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-gray-800 bg-gray-950 px-5 py-6 md:block">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
              Barbershop
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white">Scheduler</h1>
          </div>
          <nav className="space-y-2">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-900 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/notifications"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-900 hover:text-white"
            >
              Notificações
            </Link>
          </nav>
        </aside>
        <div className="border-b border-gray-800 bg-gray-950 px-4 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-white">Barbershop Scheduler</span>
            <nav className="flex gap-3 text-sm text-gray-300">
              <Link href="/">Dashboard</Link>
              <Link href="/notifications">Notificações</Link>
            </nav>
          </div>
        </div>
        <main className="min-h-screen px-4 py-6 md:ml-64 md:px-8 md:py-8">{children}</main>
      </body>
    </html>
  );
}
