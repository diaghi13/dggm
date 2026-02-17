"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useThemeSettings, useSettings } from "@/hooks/use-settings";
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  Shield,
  Package,
  Briefcase,
  ArrowRight,
  Bell,
  Mail,
  Palette,
  FileText,
  Flag,
  DollarSign,
  Search,
  X,
  Wallet,
  Receipt,
  Layout,
} from "lucide-react";

export default function SettingsIndexPage() {
  const router = useRouter();
  const { primaryColor, secondaryColor } = useThemeSettings();
  const allSettings = useSettings();

  const [searchQuery, setSearchQuery] = useState("");

  // Helper to count settings by prefix
  const getSettingsCount = (prefix: string): number => {
    return Object.keys(allSettings).filter((key) => key.startsWith(prefix))
      .length;
  };

  const settingsSections = [
    {
      title: "Generali",
      description: "Nome app, lingua, timezone e impostazioni base",
      icon: SettingsIcon,
      href: "/admin/settings?tab=general",
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-900/20",
      prefix: "app",
      keywords: ["generale", "app", "lingua", "timezone"],
    },
    {
      title: "Azienda",
      description: "Gestisci i dati della tua azienda",
      icon: Building2,
      href: "/admin/settings?tab=company",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      prefix: "company",
      keywords: ["azienda", "company", "dati"],
    },
    {
      title: "Tema",
      description: "Colori, logo, favicon e personalizzazione visiva",
      icon: Palette,
      href: "/admin/settings?tab=theme",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      prefix: "theme",
      keywords: ["tema", "colori", "logo", "branding"],
    },
    {
      title: "Interfaccia",
      description: "Formato date, items per pagina e preferenze UI",
      icon: Layout,
      href: "/admin/settings?tab=ui",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
      prefix: "ui",
      keywords: ["ui", "interfaccia", "date", "paginazione"],
    },
    {
      title: "Magazzino",
      description: "Configura inventario, movimenti e categorie materiali",
      icon: Package,
      href: "/admin/settings?tab=warehouse",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      prefix: "warehouse",
      keywords: ["magazzino", "warehouse", "inventario", "stock"],
    },
    {
      title: "Email",
      description: "Configura server email e notifiche via email",
      icon: Mail,
      href: "/admin/settings?tab=email",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
      prefix: "email",
      keywords: ["email", "smtp", "posta"],
    },
    {
      title: "Notifiche",
      description: "Gestisci le notifiche e gli avvisi del sistema",
      icon: Bell,
      href: "/admin/settings?tab=notifications",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      prefix: "notifications",
      keywords: ["notifiche", "notifications", "avvisi"],
    },
    {
      title: "File",
      description: "Configura upload, storage e tipi di file supportati",
      icon: FileText,
      href: "/admin/settings?tab=files",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
      prefix: "files",
      keywords: ["file", "upload", "storage"],
    },
    {
      title: "Prezzi & Noleggio",
      description: "Configurazione prezzi prodotti e tariffe noleggio",
      icon: DollarSign,
      href: "/admin/settings?tab=pricing",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      prefix: "pricing",
      keywords: ["prezzi", "pricing", "noleggio", "rental"],
    },
    {
      title: "Preventivi",
      description: "Template PDF, layout grafico e impostazioni dei preventivi",
      icon: Receipt,
      href: "/admin/settings?tab=quotes",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100 dark:bg-rose-900/20",
      prefix: "company.quote",
      keywords: ["preventivi", "quotes", "pdf", "template", "layout"],
    },
    {
      title: "Funzionalità",
      description: "Abilita o disabilita funzionalità sperimentali",
      icon: Flag,
      href: "/admin/settings?tab=features",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      prefix: "features",
      keywords: ["features", "flags", "funzionalità"],
    },
    {
      title: "Risorse Finanziarie",
      description:
        "Gestisci conti bancari, casse e metodi di pagamento dell'azienda",
      icon: Wallet,
      href: "/settings/financial-resources",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
      prefix: null, // Non ha settings
      keywords: [
        "risorse",
        "finanziarie",
        "conti",
        "bancari",
        "cassa",
        "pagamento",
        "financial",
      ],
    },
    {
      title: "Ruoli Cantiere",
      description:
        "Gestisci i ruoli che i lavoratori possono avere nei cantieri",
      icon: Briefcase,
      href: "/settings/site-roles",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      prefix: null, // Non ha settings
      keywords: ["ruoli", "cantiere", "site", "roles"],
    },
    {
      title: "Utenti & Permessi",
      description: "Gestisci gli utenti del sistema e i loro permessi",
      icon: Users,
      href: "/settings?tab=users",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      prefix: null, // Non ha settings
      keywords: ["utenti", "users", "permessi", "permissions"],
    },
  ];

  // Filter sections based on search query (memoized for performance)
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return settingsSections;

    const query = searchQuery.toLowerCase();
    return settingsSections.filter((section) => {
      const titleMatch = section.title.toLowerCase().includes(query);
      const descriptionMatch = section.description
        .toLowerCase()
        .includes(query);
      const keywordsMatch = section.keywords.some((keyword) =>
        keyword.toLowerCase().includes(query),
      );

      return titleMatch || descriptionMatch || keywordsMatch;
    });
  }, [searchQuery, settingsSections]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Raggruppamento delle sezioni
  const groupedSections = [
    {
      category: "Sistema",
      description: "Configurazioni base dell'applicazione",
      sections: filteredSections.filter((s) =>
        ["Generali", "Azienda", "Tema", "Interfaccia"].includes(s.title),
      ),
    },
    {
      category: "Business",
      description: "Gestione operativa e commerciale",
      sections: filteredSections.filter((s) =>
        [
          "Magazzino",
          "Prezzi & Noleggio",
          "Preventivi",
          "Risorse Finanziarie",
          "Ruoli Cantiere",
        ].includes(s.title),
      ),
    },
    {
      category: "Comunicazioni",
      description: "Email e notifiche",
      sections: filteredSections.filter((s) =>
        ["Email", "Notifiche"].includes(s.title),
      ),
    },
    {
      category: "Avanzate",
      description: "Opzioni avanzate e sperimentali",
      sections: filteredSections.filter((s) =>
        ["File", "Funzionalità", "Utenti & Permessi"].includes(s.title),
      ),
    },
  ].filter((group) => group.sections.length > 0); // Mostra solo gruppi con sezioni

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with dynamic primary color */}
      <div
        className="relative rounded-lg p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <SettingsIcon
                className="h-7 w-7"
                style={{ color: primaryColor }}
              />
            </div>
            Impostazioni
          </h1>
          <p className="text-muted-foreground mt-2 ml-13">
            Gestisci le impostazioni e configurazioni del sistema
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cerca impostazioni... (es. colori, email, magazzino)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Cerca nelle impostazioni"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClearSearch}
            aria-label="Cancella ricerca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results info */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredSections.length === 0
              ? "Nessun risultato trovato"
              : `${filteredSections.length} ${filteredSections.length === 1 ? "risultato trovato" : "risultati trovati"}`}
          </p>
          {filteredSections.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              Mostra tutto
            </Button>
          )}
        </div>
      )}

      {/* Settings Grid con raggruppamenti */}
      {groupedSections.length > 0 ? (
        <div className="space-y-8">
          {groupedSections.map((group) => (
            <div key={group.category} className="space-y-4">
              {/* Intestazione Gruppo */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {group.category}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {group.description}
                </p>
              </div>

              {/* Grid delle card del gruppo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.sections.map((section) => {
                  const Icon = section.icon;
                  const settingsCount = section.prefix
                    ? getSettingsCount(section.prefix)
                    : null;
                  const isConfigured =
                    settingsCount !== null && settingsCount > 0;

                  return (
                    <Card
                      key={section.href}
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => router.push(section.href)}
                    >
                      <CardHeader>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div
                              className={`p-3 rounded-lg ${section.bgColor}`}
                            >
                              <Icon className={`h-6 w-6 ${section.color}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              {settingsCount !== null && (
                                <Badge
                                  variant={
                                    isConfigured ? "default" : "secondary"
                                  }
                                  className="text-xs"
                                  style={
                                    isConfigured
                                      ? {
                                          backgroundColor: `${primaryColor}20`,
                                          color: primaryColor,
                                          border: `1px solid ${primaryColor}40`,
                                        }
                                      : undefined
                                  }
                                >
                                  {settingsCount}{" "}
                                  {settingsCount === 1
                                    ? "impostazione"
                                    : "impostazioni"}
                                </Badge>
                              )}
                              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {section.title}
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm">
                              {section.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {filteredSections.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nessun risultato</h3>
          <p className="text-muted-foreground mb-4">
            Prova con un'altra parola chiave
          </p>
          <Button onClick={handleClearSearch} variant="outline">
            Cancella ricerca
          </Button>
        </div>
      )}
    </div>
  );
}
