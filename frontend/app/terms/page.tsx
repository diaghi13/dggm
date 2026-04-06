import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termini di Servizio | DGGM ERP',
  description:
    'Termini e condizioni di utilizzo del software gestionale DGGM ERP per aziende edili e del settore costruzioni.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              DGGM ERP
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Termini di Servizio
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            Ultimo aggiornamento: Aprile 2026
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            I presenti Termini di Servizio (&quot;Termini&quot;) regolano l&apos;accesso e
            l&apos;utilizzo di DGGM ERP (&quot;il Servizio&quot;), un sistema gestionale
            enterprise fornito da DGGM. Leggere attentamente questi Termini prima di
            utilizzare il Servizio. Accedendo o utilizzando il Servizio, l&apos;utente
            accetta di essere vincolato dai presenti Termini.
          </p>
        </div>

        {/* Section 1 — Accettazione */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            1. Accettazione dei Termini
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Utilizzando DGGM ERP, l&apos;utente dichiara di avere almeno 18 anni,
              di avere l&apos;autorità legale per stipulare contratti vincolanti per
              conto della propria azienda e di accettare integralmente i presenti
              Termini di Servizio e la nostra{' '}
              <Link
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Informativa sulla Privacy
              </Link>
              .
            </p>
            <p>
              Se non si accettano questi Termini, non è consentito accedere o
              utilizzare il Servizio.
            </p>
          </div>
        </section>

        {/* Section 2 — Descrizione del servizio */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            2. Descrizione del Servizio
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              DGGM ERP è un sistema di gestione aziendale (ERP) progettato
              specificamente per aziende operanti nel settore edile, costruzioni,
              impiantistica e settori affini. Il Servizio comprende, tra l&apos;altro:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gestione preventivi e offerte commerciali</li>
              <li>Gestione cantieri e avanzamento lavori (SAL)</li>
              <li>Tracciamento ore e presenze con supporto GPS</li>
              <li>Gestione magazzino, DDT e movimenti materiali</li>
              <li>Gestione fornitori, clienti e anagrafiche</li>
              <li>Emissione e ricezione di fatture elettroniche (SDI)</li>
              <li>Gestione noleggio attrezzature e materiali</li>
              <li>Reportistica e analisi consuntivi</li>
            </ul>
            <p>
              Il Servizio viene erogato in modalità <em>single-tenant</em>: ciascun
              cliente dispone di un&apos;installazione dedicata e isolata, garantendo
              la completa separazione dei dati tra le aziende.
            </p>
          </div>
        </section>

        {/* Section 3 — Account */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            3. Account e Responsabilità dell&apos;Utente
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              L&apos;accesso al Servizio richiede la creazione di un account. L&apos;utente
              è responsabile di:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Mantenere riservate le proprie credenziali di accesso (username e
                password)
              </li>
              <li>
                Tutte le attività svolte tramite il proprio account, autorizzate o
                meno
              </li>
              <li>
                Notificare tempestivamente DGGM in caso di accesso non autorizzato
                o violazione della sicurezza
              </li>
              <li>
                Fornire informazioni accurate, aggiornate e complete durante la
                registrazione e l&apos;utilizzo del Servizio
              </li>
            </ul>
            <p>
              L&apos;account è strettamente personale e non è consentito condividerlo
              con terzi non autorizzati. Gli account aziendali devono essere gestiti
              dall&apos;amministratore di sistema designato dalla propria organizzazione.
            </p>
          </div>
        </section>

        {/* Section 4 — Uso accettabile */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            4. Uso Accettabile
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              L&apos;utente si impegna a utilizzare il Servizio esclusivamente per
              scopi leciti e conformi alla normativa vigente. È espressamente
              vietato:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Utilizzare il Servizio per attività illegali, fraudolente o
                lesive dei diritti altrui
              </li>
              <li>
                Tentare di accedere in modo non autorizzato a sistemi, reti o
                account di terzi
              </li>
              <li>
                Caricare, trasmettere o distribuire virus, malware o codice
                dannoso di qualsiasi tipo
              </li>
              <li>
                Effettuare operazioni di reverse engineering, decompilazione o
                disassemblaggio del software
              </li>
              <li>
                Rivendere, sublicenziare o trasferire l&apos;accesso al Servizio senza
                previa autorizzazione scritta
              </li>
              <li>
                Sovraccaricare intenzionalmente l&apos;infrastruttura del Servizio
                (attacchi DoS/DDoS o simili)
              </li>
              <li>
                Raccogliere dati di altri utenti senza consenso esplicito
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5 — Integrazioni di terze parti */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            5. Integrazioni di Terze Parti
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              DGGM ERP consente l&apos;integrazione con servizi di terze parti, tra cui:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-slate-900 dark:text-slate-100">
                  Google Gmail
                </strong>{' '}
                — per l&apos;invio di email tramite account Gmail personali o aziendali.
                L&apos;utilizzo di questa integrazione implica l&apos;accettazione dei{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Termini di Servizio di Google
                </a>{' '}
                e delle relative norme sulla privacy.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">
                  Microsoft Outlook / Exchange
                </strong>{' '}
                — per l&apos;invio di email tramite account Microsoft 365 o Exchange.
                L&apos;utilizzo di questa integrazione implica l&apos;accettazione dei{' '}
                <a
                  href="https://www.microsoft.com/it-it/servicesagreement/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Termini dei Servizi Microsoft
                </a>
                .
              </li>
            </ul>
            <p>
              DGGM non è responsabile del funzionamento, della disponibilità o
              delle politiche dei servizi di terze parti. L&apos;utente è l&apos;unico
              responsabile della gestione delle proprie credenziali e autorizzazioni
              OAuth concesse a questi servizi.
            </p>
          </div>
        </section>

        {/* Section 6 — Pagamento */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            6. Pagamento e Abbonamenti
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              L&apos;accesso a DGGM ERP è soggetto al pagamento di un canone
              d&apos;abbonamento concordato contrattualmente. Le condizioni
              economiche specifiche — inclusi importi, cadenza di fatturazione,
              modalità di pagamento e condizioni di rinnovo — sono definite nel
              contratto sottoscritto tra le parti.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                I pagamenti devono essere effettuati entro i termini indicati in
                fattura
              </li>
              <li>
                Il mancato pagamento può comportare la sospensione temporanea
                dell&apos;accesso al Servizio
              </li>
              <li>
                Eventuali modifiche al piano di abbonamento verranno comunicate
                con un preavviso minimo di 30 giorni
              </li>
              <li>
                I prezzi si intendono al netto di IVA, salvo diversa indicazione
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7 — Limitazioni */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            7. Limitazioni di Responsabilità
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Nella misura massima consentita dalla legge applicabile, DGGM non
              sarà responsabile per:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Danni indiretti, incidentali, speciali, consequenziali o punitivi
                derivanti dall&apos;utilizzo o dall&apos;impossibilità di utilizzo del
                Servizio
              </li>
              <li>
                Perdita di dati, profitti, avviamento o altre perdite intangibili
              </li>
              <li>
                Interruzioni del Servizio causate da eventi al di fuori del
                ragionevole controllo di DGGM (forza maggiore, guasti
                infrastrutturali, attacchi informatici di terzi)
              </li>
              <li>
                Errori o imprecisioni nei dati inseriti dagli utenti o provenienti
                da integrazioni di terze parti
              </li>
            </ul>
            <p>
              In ogni caso, la responsabilità complessiva di DGGM nei confronti
              dell&apos;utente non potrà eccedere quanto effettivamente pagato per
              l&apos;utilizzo del Servizio nei 12 mesi precedenti all&apos;evento che ha
              generato la responsabilità.
            </p>
          </div>
        </section>

        {/* Section 8 — Proprietà intellettuale */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            8. Proprietà Intellettuale
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              DGGM ERP, inclusi il software, il design, i loghi, i marchi, la
              documentazione e qualsiasi altro contenuto fornito da DGGM, è di
              proprietà esclusiva di DGGM o dei rispettivi licenziatari ed è
              protetto dalle leggi italiane ed internazionali in materia di
              proprietà intellettuale.
            </p>
            <p>
              All&apos;utente viene concessa una licenza limitata, non esclusiva, non
              trasferibile e revocabile per accedere e utilizzare il Servizio
              esclusivamente per le finalità aziendali interne, nei limiti previsti
              dal contratto sottoscritto.
            </p>
            <p>
              I dati inseriti dall&apos;utente nel Servizio rimangono di sua esclusiva
              proprietà. DGGM non rivendica alcun diritto su tali dati, fermo
              restando il diritto di elaborarli nella misura necessaria alla
              fornitura del Servizio.
            </p>
          </div>
        </section>

        {/* Section 9 — Risoluzione */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            9. Risoluzione del Contratto
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Ciascuna parte può recedere dal contratto nel rispetto dei termini
              di preavviso stabiliti nell&apos;accordo commerciale sottoscritto.
            </p>
            <p>
              DGGM si riserva il diritto di sospendere o terminare immediatamente
              l&apos;accesso al Servizio in caso di:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violazione grave dei presenti Termini di Servizio</li>
              <li>
                Mancato pagamento del canone oltre i termini di tolleranza
                contrattualmente stabiliti
              </li>
              <li>
                Utilizzo del Servizio per attività illegali o che danneggino
                DGGM o terzi
              </li>
            </ul>
            <p>
              In caso di risoluzione, l&apos;utente potrà richiedere l&apos;esportazione
              dei propri dati entro 30 giorni dalla data di cessazione. Trascorso
              tale termine, DGGM potrà procedere alla cancellazione definitiva dei
              dati.
            </p>
          </div>
        </section>

        {/* Section 10 — Modifiche */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            10. Modifiche ai Termini
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              DGGM si riserva il diritto di modificare i presenti Termini in
              qualsiasi momento. Le modifiche sostanziali verranno comunicate agli
              utenti tramite notifica nell&apos;applicazione o via email con un
              preavviso di almeno 15 giorni prima dell&apos;entrata in vigore.
            </p>
            <p>
              Il proseguimento dell&apos;utilizzo del Servizio dopo la data di entrata
              in vigore delle modifiche costituirà accettazione dei nuovi Termini.
              In caso di mancata accettazione, l&apos;utente ha il diritto di recedere
              dal contratto nei termini previsti.
            </p>
          </div>
        </section>

        {/* Section 11 — Legge applicabile */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            11. Legge Applicabile e Foro Competente
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              I presenti Termini sono disciplinati dalla legge italiana. Per
              qualsiasi controversia derivante dall&apos;interpretazione, esecuzione o
              risoluzione del presente accordo, le parti si sottomettono alla
              giurisdizione esclusiva del Tribunale competente per il luogo in cui
              DGGM ha la propria sede legale, salvo diverso accordo scritto tra le
              parti.
            </p>
            <p>
              Le parti si impegnano a tentare in buona fede di risolvere
              amichevolmente qualsiasi controversia prima di adire le vie legali.
            </p>
          </div>
        </section>

        {/* Section 12 — Contatti */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            12. Contatti
          </h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Per domande, chiarimenti o richieste relative ai presenti Termini di
              Servizio, è possibile contattarci ai seguenti recapiti:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-1">
              <p>
                <strong className="text-slate-900 dark:text-slate-100">
                  DGGM
                </strong>
              </p>
              <p>Email: info@dggm.it</p>
            </div>
            <p>
              Ci impegniamo a rispondere a ogni richiesta entro 5 giorni
              lavorativi.
            </p>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-slate-200 dark:border-slate-800 mb-8" />

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-500">
          <p>© 2026 DGGM. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Informativa sulla Privacy
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
