\"use client\";

import Link from \"next/link\";
import { useListJobsQuery } from \"@/lib/api/base\";
import { statusLabels } from \"./statusLabels\";

const formatDate = (value?: string) => {
  if (!value) return \"-\";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function JobsPage() {
  const { data: jobs, isLoading } = useListJobsQuery();

  return (
    <div className="page jobs-page">
      <header className="page-header">
        <div>
          <p className="badge">Monitoring</p>
          <h1>Jobs de fine-tuning</h1>
          <p className="text-muted">Suivi des executions BullMQ et etat des workers.</p>
        </div>
        <Link className="button-primary" href="/jobs/new">
          Nouveau job
        </Link>
      </header>

      <div className="glow-panel table-wrapper">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Modele</th>
              <th>Dataset</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Derniere maj</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-muted">
                  Chargement en cours...
                </td>
              </tr>
            )}
            {!isLoading && jobs?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted">
                  Aucun job pour le moment.
                </td>
              </tr>
            )}
            {jobs?.map((job) => (
              <tr key={job.id}>
                <td>
                  <Link href={/jobs/}>{job.payload?.outputName ?? job.id}</Link>
                </td>
                <td>{job.payload?.baseModelId ?? \"-\"}</td>
                <td>{job.payload?.datasetId ?? \"-\"}</td>
                <td>
                  <span className={status-pill status-}>
                    {statusLabels[job.status]}
                  </span>
                </td>
                <td>{job.progress != null ? ${Math.round(job.progress)}% : \"-\"}</td>
                <td>{formatDate(job.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
