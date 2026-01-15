'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  Shield,
  Package,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export default function SettingsIndexPage() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Materiali',
      description: 'Gestisci categorie e tipi dipendenza per i materiali',
      icon: Package,
      href: '/dashboard/settings',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Ruoli Cantiere',
      description: 'Gestisci i ruoli che i lavoratori possono avere nei cantieri',
      icon: Briefcase,
      href: '/dashboard/settings/site-roles',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Utenti',
      description: 'Gestisci gli utenti del sistema',
      icon: Users,
      href: '/dashboard/settings#users',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Azienda',
      description: 'Gestisci le informazioni della tua azienda',
      icon: Building2,
      href: '/dashboard/settings#company',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-7 w-7" />
          Impostazioni
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Gestisci le impostazioni del sistema
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
