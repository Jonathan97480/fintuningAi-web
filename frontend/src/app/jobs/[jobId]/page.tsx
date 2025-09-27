\"use client\";

import Link from \"next/link\";
import { useParams } from \"next/navigation\";
import { useGetJobQuery, useListJobEventsQuery } from \"@/lib/api/base\";
import { statusLabels } from \"../statusLabels\";
import { useMemo } from \"react\";

const formatDate = (value?: string) => {
  if (!value) return \"-\";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job } = useGetJobQuery(jobId);
  const { data: events } = useListJobEventsQuery(jobId);

  const payloadEntries = useMemo(
    () => Object.entries(job?.payload ?? {}),
    [job?.payload]
  );

  return (
    <div className="page job-detail">
      <header className="page-header">
        <div>
          <p className="badge">Job {jobId}</p>
          <h1>{job?.payload?.outputName ?? jobId}</h1>
          <p className="text-muted">
            Statut: <span className={status-pill status-}>{job ? statusLabels[job.status] : \"...\"}</span>
          </p>
        </div>
        <Link className="ghost-button" href="/jobs">
          &larr; Retour
        </Link>
      </header>

      <section className="glow-panel job-meta">
        <h2>Details</h2>
        <dl>
          <div>
            <dt>Modele</dt>
            <dd>{job?.payload?.baseModelId ?? \"-\"}</dd>
          </div>
          <div>
            <dt>Dataset</dt>
            <dd>{job?.payload?.datasetId ?? \"-\"}</dd>
          </div>
          <div>
            <dt>Progression</dt>
            <dd>{job?.progress != null ? ${Math.round(job.progress)}% : \"-\"}</dd>
          </div>
          <div>
            <dt>Derniere mise a jour</dt>
            <dd>{formatDate(job?.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="glow-panel job-payload">
        <h2>Parametres</h2>
        <ul>
          {payloadEntries.map(([key, value]) => (
            <li key={key}>
              <strong>{key}</strong>
              <span>{JSON.stringify(value)}</span>
            </li>
          ))}
          {payloadEntries.length === 0 && <li className="text-muted">Aucun parametre.</li>}
        </ul>
      </section>

      <section className="glow-panel job-events">
        <h2>Evenements recents</h2>
        <ul>
          {events?.map((event) => (
            <li key={event.id}>
              <span className={vent-level level-}>{event.level}</span>
              <span>{event.message}</span>
              <time>{formatDate(event.createdAt)}</time>
            </li>
          ))}
          {(!events || events.length === 0) && <li className="text-muted">En attente d'activite.</li>}
        </ul>
      </section>
    </div>
  );
}
