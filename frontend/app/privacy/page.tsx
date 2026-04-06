import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowLeft, Shield, Database, Mail, Clock, UserCheck, Lock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy | DGGM ERP",
  description: "Informativa sulla privacy di DGGM ERP: come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali.",
};

const sections = [
  { id: "titolare", label: "Titolare del trattamento" },
  { id: "dati-raccolti", label: "Dati raccolti" },
  { id: "gmail-microsoft", label: "Integrazione Gmail e Microsoft" },
  { id: "utilizzo", label: "Come usiamo i dati" },
  { id: "conservazione", label: "Conservazione dei dati" },
  { id: "diritti", label: "Diritti degli interessati" },
  { id: "sicurezza", label: "Sicurezza" },
  { id: "contatti", label: "Contatti" },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">DGGM ERP</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Informativa sulla Privacy
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ultimo aggiornamento: Aprile 2026
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Contenuto
              </p>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-colors"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-10">

              {/* Intro */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                La presente Informativa sulla Privacy descrive come <strong>DGGM ERP</strong> raccoglie,
                utilizza e protegge i dati personali degli utenti in conformità al{" "}
                <strong>Regolamento (UE) 2016/679 (GDPR)</strong> e alla normativa applicabile in materia
                di protezione dei dati personali.
              </p>

              {/* 1. Titolare */}
              <section id="titolare">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    1. Titolare del trattamento
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  Il Titolare del trattamento dei dati personali è l'azienda che ha acquistato e
                  installato DGGM ERP per la propria organizzazione. Le informazioni di contatto del
                  Titolare sono disponibili nelle impostazioni dell'applicazione e nella presente
                  informativa alla sezione "Contatti".
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  DGGM ERP è un sistema gestionale (ERP) sviluppato per le aziende del settore
                  edile e delle costruzioni. L'applicazione viene installata in modalità
                  single-tenant: ogni azienda cliente dispone di una propria istanza dedicata e
                  isolata.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 2. Dati raccolti */}
              <section id="dati-raccolti">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    2. Dati raccolti
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  DGGM ERP raccoglie e tratta le seguenti categorie di dati personali:
                </p>

                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Dati account utente
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                      <li>Nome e cognome</li>
                      <li>Indirizzo email aziendale</li>
                      <li>Password (memorizzata in forma crittografata con bcrypt)</li>
                      <li>Ruolo e permessi nell'applicazione</li>
                      <li>Data di registrazione e ultimo accesso</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Dati aziendali e operativi
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                      <li>Dati di clienti, fornitori e dipendenti inseriti nel gestionale</li>
                      <li>Preventivi, ordini, fatture e documenti aziendali</li>
                      <li>Dati di magazzino e movimentazione materiali</li>
                      <li>Registrazioni presenze e timbrature GPS (per i moduli Time Tracking)</li>
                      <li>Dati cantieri e avanzamento lavori</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Log di sistema
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                      <li>Log di accesso (IP, timestamp, dispositivo)</li>
                      <li>Attività degli utenti per finalità di audit e sicurezza</li>
                      <li>Log di invio email (mittente, destinatario, oggetto, timestamp)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 3. Gmail e Microsoft */}
              <section id="gmail-microsoft">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    3. Integrazione con Gmail e Microsoft (OAuth)
                  </h2>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-5 mb-5">
                  <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
                    Informazione importante — Google API Services User Data Policy
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                    L'utilizzo di DGGM ERP delle informazioni ricevute dalle API di Google è conforme alla{" "}
                    <strong>Google API Services User Data Policy</strong>, inclusi i requisiti sull'uso
                    limitato dei dati (<em>Limited Use requirements</em>).
                  </p>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-5">
                  DGGM ERP consente agli utenti di collegare il proprio account <strong>Gmail</strong>{" "}
                  o <strong>Microsoft 365 / Outlook</strong> tramite il protocollo OAuth 2.0. Questa
                  funzionalità permette di inviare email direttamente dal gestionale usando la propria
                  casella di posta personale o aziendale (ad esempio per inviare preventivi, fatture
                  e comunicazioni ai clienti).
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Cosa facciamo con i permessi Gmail / Microsoft
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                      <li>
                        <strong>Inviamo email per conto tuo</strong>: utilizziamo il permesso{" "}
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          gmail.send
                        </code>{" "}
                        (o equivalente Microsoft) esclusivamente per inviare email generate
                        dall'applicazione (preventivi, fatture, comunicazioni) utilizzando il tuo indirizzo
                        email come mittente.
                      </li>
                      <li>
                        <strong>NON leggiamo le email ricevute</strong>: DGGM ERP non accede, non legge,
                        non analizza e non memorizza il contenuto delle email presenti nella tua casella
                        di posta in arrivo o in qualsiasi altra cartella.
                      </li>
                      <li>
                        <strong>NON condividiamo i dati con terze parti</strong>: i token di accesso e
                        qualsiasi dato ottenuto tramite le API Gmail o Microsoft non vengono condivisi,
                        venduti o trasmessi a terze parti per alcun scopo.
                      </li>
                      <li>
                        <strong>NON usiamo i dati per pubblicità</strong>: i permessi Gmail/Microsoft non
                        vengono mai utilizzati per profilazione, pubblicità o finalità diverse dall'invio
                        di email per conto dell'utente.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Memorizzazione sicura dei token OAuth
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                      <li>
                        I token di accesso OAuth (access token e refresh token) rilasciati da Google o
                        Microsoft sono memorizzati nel database dell'applicazione in forma <strong>crittografata</strong>,
                        utilizzando algoritmi di cifratura standard del settore (AES-256).
                      </li>
                      <li>
                        I token non sono mai accessibili in chiaro agli utenti o agli amministratori
                        dell'applicazione e non vengono mai trasmessi in forma non cifrata.
                      </li>
                      <li>
                        L'accesso ai token è strettamente limitato ai processi interni dell'applicazione
                        necessari per l'invio delle email.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Permessi richiesti (scopes)
                    </h3>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Per Gmail, DGGM ERP richiede esclusivamente:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-200 flex-shrink-0 mt-0.5">
                            https://www.googleapis.com/auth/gmail.send
                          </code>
                          <span className="text-slate-600 dark:text-slate-400">
                            — Consente l'invio di email. Non permette la lettura delle email ricevute.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-200 flex-shrink-0 mt-0.5">
                            https://www.googleapis.com/auth/userinfo.email
                          </code>
                          <span className="text-slate-600 dark:text-slate-400">
                            — Consente di leggere il tuo indirizzo email per identificare l'account collegato.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-800 dark:text-slate-200 flex-shrink-0 mt-0.5">
                            https://www.googleapis.com/auth/userinfo.profile
                          </code>
                          <span className="text-slate-600 dark:text-slate-400">
                            — Consente di leggere nome e foto profilo per la visualizzazione nell'app.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Come revocare l'accesso
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                      Puoi revocare l'autorizzazione concessa a DGGM ERP in qualsiasi momento, senza
                      necessità di giustificazione:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                      <li>
                        <strong>Dall'applicazione</strong>: accedi a{" "}
                        <em>Impostazioni → Account email → [account collegato] → Disconnetti</em>.
                        Questo rimuove immediatamente i token dal database.
                      </li>
                      <li>
                        <strong>Da Google</strong>: visita{" "}
                        <a
                          href="https://myaccount.google.com/permissions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                        >
                          myaccount.google.com/permissions
                        </a>{" "}
                        e rimuovi DGGM ERP dall'elenco delle app con accesso al tuo account.
                      </li>
                      <li>
                        <strong>Da Microsoft</strong>: visita il portale{" "}
                        <a
                          href="https://myapps.microsoft.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                        >
                          myapps.microsoft.com
                        </a>{" "}
                        e revoca i permessi concessi all'applicazione.
                      </li>
                    </ul>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
                      Dopo la revoca, DGGM ERP non sarà più in grado di inviare email tramite il tuo
                      account, ma tutte le email precedentemente inviate rimangono nella cronologia
                      del gestionale.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 4. Come usiamo i dati */}
              <section id="utilizzo">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    4. Come utilizziamo i dati
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  I dati raccolti vengono utilizzati esclusivamente per le seguenti finalità:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Erogazione del servizio</strong>: fornire le funzionalità del gestionale
                    (cantieri, preventivi, magazzino, timesheet, fatturazione).
                  </li>
                  <li>
                    <strong>Autenticazione e sicurezza</strong>: verificare l'identità degli utenti
                    e proteggere l'accesso ai dati aziendali.
                  </li>
                  <li>
                    <strong>Comunicazioni operative</strong>: inviare email transazionali (preventivi,
                    fatture, notifiche di sistema) per conto dell'azienda.
                  </li>
                  <li>
                    <strong>Audit e conformità</strong>: mantenere log delle attività per finalità
                    di sicurezza e conformità normativa.
                  </li>
                  <li>
                    <strong>Supporto tecnico</strong>: diagnosticare e risolvere problemi tecnici
                    su richiesta dell'amministratore del sistema.
                  </li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
                  I dati personali non vengono mai utilizzati per finalità di marketing, profilazione
                  commerciale o analisi comportamentale, né ceduti a terze parti per scopi diversi
                  da quelli elencati.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 5. Conservazione */}
              <section id="conservazione">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    5. Conservazione dei dati
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  I dati personali vengono conservati per il tempo strettamente necessario alle finalità
                  per cui sono stati raccolti, nel rispetto degli obblighi di legge:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Dati account utente</strong>: fino alla disattivazione dell'account o alla
                    cessazione del contratto di utilizzo dell'ERP.
                  </li>
                  <li>
                    <strong>Dati fiscali e contabili</strong> (fatture, preventivi): 10 anni dalla
                    chiusura dell'esercizio, in conformità agli obblighi fiscali italiani.
                  </li>
                  <li>
                    <strong>Log di sistema</strong>: 12 mesi, salvo diversa indicazione dell'amministratore
                    o obblighi di legge.
                  </li>
                  <li>
                    <strong>Token OAuth (Gmail/Microsoft)</strong>: fino alla disconnessione dell'account
                    da parte dell'utente o alla scadenza del token non rinnovato.
                  </li>
                  <li>
                    <strong>Dati GPS e timbrature</strong>: per tutta la durata del rapporto di lavoro
                    e per il periodo previsto dalla normativa applicabile.
                  </li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
                  Al termine del periodo di conservazione, i dati vengono eliminati in modo sicuro o
                  anonimizzati irreversibilmente.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 6. Diritti */}
              <section id="diritti">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    6. Diritti degli interessati (GDPR)
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  In conformità al Regolamento GDPR (artt. 15–22), ogni utente ha diritto di:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Accesso</strong> (art. 15): ottenere conferma del trattamento dei propri
                    dati e una copia degli stessi.
                  </li>
                  <li>
                    <strong>Rettifica</strong> (art. 16): richiedere la correzione di dati inesatti
                    o incompleti.
                  </li>
                  <li>
                    <strong>Cancellazione</strong> (art. 17): richiedere la cancellazione dei dati,
                    salvo obblighi di conservazione legali.
                  </li>
                  <li>
                    <strong>Limitazione del trattamento</strong> (art. 18): richiedere la limitazione
                    del trattamento in determinate circostanze.
                  </li>
                  <li>
                    <strong>Portabilità</strong> (art. 20): ricevere i propri dati in formato
                    strutturato e leggibile da macchina.
                  </li>
                  <li>
                    <strong>Opposizione</strong> (art. 21): opporsi al trattamento dei dati personali.
                  </li>
                  <li>
                    <strong>Revoca del consenso</strong>: revocare in qualsiasi momento il consenso
                    prestato, senza pregiudicare la liceità del trattamento effettuato anteriormente.
                  </li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
                  Per esercitare i propri diritti, contattare il Titolare del trattamento tramite i
                  riferimenti indicati nella sezione "Contatti". Il diritto di proporre reclamo
                  all'Autorità Garante per la Protezione dei Dati Personali (Garante Privacy) rimane
                  sempre disponibile.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 7. Sicurezza */}
              <section id="sicurezza">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    7. Sicurezza
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  DGGM ERP adotta misure tecniche e organizzative adeguate per proteggere i dati
                  personali da accessi non autorizzati, perdita, divulgazione o distruzione:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Cifratura</strong>: tutti i dati sensibili (password, token OAuth) sono
                    memorizzati in forma crittografata. Le comunicazioni avvengono esclusivamente
                    tramite HTTPS/TLS.
                  </li>
                  <li>
                    <strong>Autenticazione sicura</strong>: utilizzo di Laravel Sanctum per la
                    gestione dei token di sessione con scadenza automatica.
                  </li>
                  <li>
                    <strong>Controllo degli accessi</strong>: sistema di ruoli e permessi granulari
                    (RBAC) che limita l'accesso ai dati in base al ruolo dell'utente.
                  </li>
                  <li>
                    <strong>Rate limiting</strong>: limitazione delle richieste API per prevenire
                    attacchi brute-force e abusi.
                  </li>
                  <li>
                    <strong>Backup</strong>: backup automatici e crittografati del database con
                    conservazione sicura.
                  </li>
                  <li>
                    <strong>Isolamento tenant</strong>: ogni installazione è completamente isolata
                    dalle altre, con database dedicato.
                  </li>
                </ul>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
                  Nonostante le misure adottate, nessun sistema informatico può garantire una sicurezza
                  assoluta. In caso di violazione dei dati personali che possa comportare un rischio
                  per gli interessati, il Titolare provvederà alla notifica all'autorità di controllo
                  e agli interessati nei tempi previsti dal GDPR.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* 8. Contatti */}
              <section id="contatti">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    8. Contatti
                  </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  Per qualsiasi domanda relativa al trattamento dei dati personali, per esercitare i
                  diritti previsti dal GDPR o per richiedere informazioni sull'integrazione OAuth,
                  contattare il Titolare del trattamento:
                </p>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    Le informazioni di contatto del Titolare del trattamento sono disponibili nelle
                    impostazioni aziendali dell'applicazione (
                    <em>Impostazioni → Azienda</em>
                    ) o possono essere richieste all'amministratore di sistema della propria
                    organizzazione.
                  </p>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-4">
                  È possibile presentare reclamo all'
                  <strong>Autorità Garante per la Protezione dei Dati Personali</strong>:{" "}
                  <a
                    href="https://www.garanteprivacy.it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    www.garanteprivacy.it
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} DGGM ERP. Tutti i diritti riservati.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Termini di servizio
                </Link>
                <Link
                  href="/"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
