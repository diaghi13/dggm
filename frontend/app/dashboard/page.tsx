'use client';

import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { sitesApi } from '@/lib/api/sites';
import { quotesApi } from '@/lib/api/quotes';
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  Euro,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: customersData } = useQuery({
    queryKey: ['customers', { per_page: 5 }],
    queryFn: () => customersApi.getAll({ per_page: 5, is_active: true }),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['sites', { per_page: 5 }],
    queryFn: () => sitesApi.getAll({ per_page: 5 }),
  });

  const { data: quotesData } = useQuery({
    queryKey: ['quotes', { per_page: 5 }],
    queryFn: () => quotesApi.getAll({ per_page: 5 }),
  });

  const stats = [
    {
      title: 'Clienti Attivi',
      value: customersData?.meta.total || 0,
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue' as const,
      href: '/dashboard/customers',
    },
    {
      title: 'Cantieri Aperti',
      value: sitesData?.data.length || 0,
      change: '+8%',
      trend: 'up' as const,
      icon: Building2,
      color: 'green' as const,
      href: '/dashboard/sites',
    },
    {
      title: 'Preventivi',
      value: quotesData?.meta.total || 0,
      change: '-3%',
      trend: 'down' as const,
      icon: FileText,
      color: 'purple' as const,
      href: '/dashboard/quotes',
    },
    {
      title: 'Fatturato Mese',
      value: '€45,231',
      change: '+23%',
      trend: 'up' as const,
      icon: Euro,
      color: 'orange' as const,
      href: '/dashboard/invoices',
    },
  ];

  const recentActivities = [
    {
      type: 'quote',
      title: 'Nuovo preventivo creato',
      description: 'Ristrutturazione Appartamento - Edilizia Moderna SRL',
      time: '2 ore fa',
      icon: FileText,
      color: 'blue' as const,
    },
    {
      type: 'site',
      title: 'Cantiere avviato',
      description: 'Costruzione Capannone Industriale - Roma',
      time: '5 ore fa',
      icon: Building2,
      color: 'green' as const,
    },
    {
      type: 'customer',
      title: 'Nuovo cliente aggiunto',
      description: 'Costruzioni Bianchi SPA',
      time: '1 giorno fa',
      icon: Users,
      color: 'purple' as const,
    },
  ];

  const upcomingTasks = [
    {
      title: 'Scadenza preventivo PRV-2024-001',
      date: '15 Gen 2026',
      priority: 'high' as const,
    },
    {
      title: 'Inizio cantiere Via Roma',
      date: '18 Gen 2026',
      priority: 'medium' as const,
    },
    {
      title: 'Fattura da emettere',
      date: '20 Gen 2026',
      priority: 'low' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Panoramica generale dell&apos;attività aziendale
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Link href={stat.href} key={index}>
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">vs mese scorso</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Attività Recenti
              </h3>
              <Button variant="ghost" size="sm" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                Vedi tutto
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;

                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              Prossime Scadenze
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => {
                const priorityColors = {
                  high: 'border-l-red-500 dark:border-l-red-400 bg-red-50/50 dark:bg-red-950/20',
                  medium: 'border-l-amber-500 dark:border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
                  low: 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20',
                }[task.priority];

                return (
                  <div key={index} className={`p-3 rounded border-l-2 ${priorityColors} border border-slate-100`}>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">{task.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Azioni Rapide
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/customers">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 transition-colors">
                <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Nuovo Cliente</span>
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 transition-colors">
                <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Nuovo Preventivo</span>
              </Button>
            </Link>
            <Link href="/dashboard/sites">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 transition-colors">
                <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Nuovo Cantiere</span>
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 transition-colors">
                <Euro className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Nuova Fattura</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
