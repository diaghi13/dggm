'use client';

import { cn } from '@/lib/utils';
import {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Receipt,
} from 'lucide-react';

const iconMap = {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Receipt,
};

// Definizione dei gruppi con categorizzazione logica
const SIDEBAR_GROUPS = [
  {
    category: 'Sistema',
    items: [
      { key: 'general', label: 'Generali', icon: 'Settings' },
      { key: 'company', label: 'Azienda', icon: 'Building2' },
      { key: 'theme', label: 'Tema', icon: 'Palette' },
      { key: 'ui', label: 'Interfaccia', icon: 'Layout' },
    ],
  },
  {
    category: 'Business',
    items: [
      { key: 'warehouse', label: 'Magazzino', icon: 'Package' },
      { key: 'pricing', label: 'Prezzi & Noleggio', icon: 'DollarSign' },
      { key: 'quotes', label: 'Preventivi', icon: 'Receipt' },
    ],
  },
  {
    category: 'Comunicazioni',
    items: [
      { key: 'email', label: 'Email', icon: 'Mail' },
      { key: 'notifications', label: 'Notifiche', icon: 'Bell' },
    ],
  },
  {
    category: 'Avanzate',
    items: [
      { key: 'files', label: 'File', icon: 'FileText' },
      { key: 'features', label: 'Funzionalità', icon: 'Flag' },
    ],
  },
];

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-6 space-y-6">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.category}>
            {/* Category Label */}
            <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
              {group.category}
            </h3>

            {/* Items */}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Settings;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => onTabChange(item.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      'hover:bg-slate-100 dark:hover:bg-slate-800/50',
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
