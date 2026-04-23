import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { ConvocazioneEntry } from '@/lib/api/projects'
import { Project } from '@/lib/types'

interface ConvocazioniPrintViewProps {
  project: Project
  convocazioni: ConvocazioneEntry[]
  printedAt?: Date
  showOnlyAccepted?: boolean
}

const statusBorderColor: Record<string, string> = {
  accepted: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
  modified: '#3b82f6',
  completed: '#6366f1',
  cancelled: '#9ca3af',
}

const statusLabel: Record<string, string> = {
  accepted: 'Accettato',
  pending: 'In attesa',
  rejected: 'Rifiutato',
  modified: 'Modificato',
  completed: 'Completato',
  cancelled: 'Annullato',
}

const DATES_PER_CHUNK = 10

export default function ConvocazioniPrintView({
  project,
  convocazioni: convocazioniRaw,
  printedAt,
  showOnlyAccepted = false,
}: ConvocazioniPrintViewProps) {
  const convocazioni = showOnlyAccepted
    ? convocazioniRaw.filter((c) => c.status === 'accepted')
    : convocazioniRaw

  // Get unique workers sorted by name
  const workers = Array.from(
    new Map(
      convocazioni.map((c) => [
        c.worker_id ?? c.worker_name,
        { worker_id: c.worker_id, worker_name: c.worker_name, role_name: c.role_name },
      ])
    ).values()
  ).sort((a, b) => (a.worker_name ?? '').localeCompare(b.worker_name ?? ''))

  // Get unique dates sorted
  const dates = [...new Set(convocazioni.map((c) => c.scheduled_date))].sort()

  // Lookup: workerKey + date → entry
  const lookup = new Map(
    convocazioni.map((c) => [`${c.worker_id ?? c.worker_name}__${c.scheduled_date}`, c])
  )

  // Chunk dates into groups of 10 for multi-page
  const dateChunks: string[][] = []
  for (let i = 0; i < dates.length; i += DATES_PER_CHUNK) {
    dateChunks.push(dates.slice(i, i + DATES_PER_CHUNK))
  }

  if (convocazioni.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '9pt',
          color: '#111',
          background: '#fff',
          textAlign: 'center',
          padding: '20mm',
        }}
      >
        <style>{`
          @page { size: A3 landscape; margin: 10mm 8mm; }
        `}</style>
        <div style={{ color: '#9ca3af', fontSize: '10pt' }}>
          {showOnlyAccepted ? 'Nessuna convocazione accettata' : 'Nessuna convocazione pianificata'}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '9pt',
        color: '#111',
        background: '#fff',
        padding: '10mm 8mm',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @page { size: A3 landscape; margin: 10mm 8mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-after: always; break-after: always; }
        }
      `}</style>

      {dateChunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex} className={chunkIndex < dateChunks.length - 1 ? 'page-break' : ''}>
          {/* Header */}
          <div
            style={{
              marginBottom: '6mm',
              borderBottom: '2px solid #111',
              paddingBottom: '3mm',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14pt', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {project.name}
                </div>
                <div style={{ fontSize: '8pt', color: '#555', marginTop: '1mm' }}>
                  {project.code}
                  {project.customer && ` · ${project.customer.display_name}`}
                  {project.full_address && ` · ${project.full_address}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '8pt', color: '#555' }}>
                {project.start_date && (
                  <div>Inizio: {format(parseISO(project.start_date), 'dd/MM/yyyy')}</div>
                )}
                {project.estimated_end_date && (
                  <div>
                    Fine prevista: {format(parseISO(project.estimated_end_date), 'dd/MM/yyyy')}
                  </div>
                )}
                {project.project_manager && <div>PM: {project.project_manager.name}</div>}
                <div style={{ marginTop: '1mm', color: '#999' }}>
                  Stampato il {format(printedAt ?? new Date(), 'dd/MM/yyyy HH:mm')}
                  {dateChunks.length > 1 &&
                    ` · Pagina ${chunkIndex + 1}/${dateChunks.length}`}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: '2mm',
                fontSize: '8pt',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#777',
              }}
            >
              {showOnlyAccepted ? 'Foglio Presenze' : 'Piano Convocazioni'}
              {dateChunks.length > 1
                ? ` (date ${chunkIndex * DATES_PER_CHUNK + 1}–${Math.min(
                    (chunkIndex + 1) * DATES_PER_CHUNK,
                    dates.length
                  )} di ${dates.length})`
                : ''}
            </div>
          </div>

          {/* Matrix table */}
          <table
            style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
              {chunk.map((d) => (
                <col key={d} style={{ width: `${Math.floor((100 - 15) / chunk.length)}%` }} />
              ))}
              {showOnlyAccepted && <col style={{ width: '70px' }} />}
            </colgroup>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1.5px solid #d1d5db',
                }}
              >
                <th
                  style={{
                    padding: '4px 6px',
                    textAlign: 'left',
                    fontSize: '7.5pt',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#374151',
                  }}
                >
                  Lavoratore
                </th>
                <th
                  style={{
                    padding: '4px 6px',
                    textAlign: 'left',
                    fontSize: '7.5pt',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#374151',
                  }}
                >
                  Ruolo
                </th>
                {chunk.map((date) => (
                  <th
                    key={date}
                    style={{
                      padding: '4px 3px',
                      textAlign: 'center',
                      fontSize: '7.5pt',
                      fontWeight: 600,
                      color: '#374151',
                      borderLeft: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {format(parseISO(date), 'EEE', { locale: it })}
                    </div>
                    <div>{format(parseISO(date), 'dd/MM')}</div>
                  </th>
                ))}
                {showOnlyAccepted && (
                  <th
                    style={{
                      padding: '4px 6px',
                      textAlign: 'center',
                      fontSize: '7.5pt',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#374151',
                      borderLeft: '1px solid #e5e7eb',
                    }}
                  >
                    Firma
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, workerIndex) => {
                const workerKey = worker.worker_id ?? worker.worker_name
                return (
                  <tr
                    key={String(workerKey)}
                    style={{
                      backgroundColor: workerIndex % 2 === 0 ? '#fff' : '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <td style={{ padding: '4px 6px', fontSize: '8pt', fontWeight: 500 }}>
                      {worker.worker_name ?? '—'}
                    </td>
                    <td style={{ padding: '4px 6px', fontSize: '7.5pt', color: '#6b7280' }}>
                      {worker.role_name ?? '—'}
                    </td>
                    {chunk.map((date) => {
                      const entry = lookup.get(`${String(workerKey)}__${date}`)
                      const borderColor = entry
                        ? (statusBorderColor[entry.status] ?? '#9ca3af')
                        : 'transparent'
                      return (
                        <td
                          key={date}
                          style={{
                            padding: '3px 4px',
                            fontSize: '7.5pt',
                            textAlign: 'center',
                            borderLeft: `3px solid ${borderColor}`,
                            borderRight: '1px solid #f3f4f6',
                            verticalAlign: 'top',
                          }}
                        >
                          {entry ? (
                            <>
                              <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {entry.planned_start_time?.slice(0, 5) ?? '—'}
                              </div>
                              <div style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                                {entry.planned_end_time?.slice(0, 5) ?? '—'}
                              </div>
                              <div style={{ color: '#9ca3af', fontSize: '6.5pt' }}>
                                {entry.effective_planned_hours}h
                              </div>
                            </>
                          ) : (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                      )
                    })}
                    {showOnlyAccepted && (
                      <td style={{ padding: '3px 6px', borderLeft: '1px solid #e5e7eb' }}>
                        <div style={{ border: '1px solid #d1d5db', height: '18px', borderRadius: '2px' }} />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Legend — only on last page, hidden when showing accepted-only */}
          {chunkIndex === dateChunks.length - 1 && !showOnlyAccepted && (
            <div
              style={{
                marginTop: '4mm',
                display: 'flex',
                gap: '12px',
                fontSize: '7pt',
                color: '#555',
              }}
            >
              <span style={{ fontWeight: 600 }}>Legenda:</span>
              {Object.entries(statusBorderColor).map(([status, color]) => (
                <span
                  key={status}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      backgroundColor: color,
                      borderRadius: '2px',
                    }}
                  />
                  {statusLabel[status]}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
