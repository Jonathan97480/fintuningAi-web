\"use client\";

import Link from \"next/link\";
import { useGetHealthQuery, useListModelsQuery } from \"@/lib/api/base\";
import { useMemo } from \"react\";

const quickLinks = [
  { label: \"Lancer un fine-tuning\", href: \"/jobs/new\" },
  { label: \"Parcourir les datasets\", href: \"/datasets\" },
  { label: \"Catalogue modeles\", href: \"/models\" },
  { label: \"Historique des jobs\", href: \"/jobs\" },
];

export default function Home() {
  const { data: health } = useGetHealthQuery();
  const { data: models } = useListModelsQuery({ task: "text-generation" });

  const featuredModels = useMemo(() => models?.results.slice(0, 3) ?? [], [models]);

  return (
    <div className="landing">
      <section className="hero glow-panel">
        <p className="badge">v0.1 &bull; Orchestrateur fine-tuning</p>
        <h1>
          Revolutionner votre pipeline de <span className="accent">fine-tuning</span>.
        </h1>
        <p className="text-muted">
          Suivez vos jobs, synchronisez Hugging Face et pilotez vos workers Python avec une interface futuriste, securisee et collaborative.
        </p>
        <div className="hero-actions">
          <Link className="button-primary" href="/jobs/new">
            Demarrer un job
          </Link>
          <Link className="ghost-button" href="/demo">
            Voir la demo
          </Link>
        </div>
      </section>

      <section className="quick-links">
        {quickLinks.map((item) => (
          <Link key={item.href} className="quick-link glow-panel" href={item.href}>
            <span>{item.label}</span>
          </Link>
        ))}
      </section>

      <section className="status-panels">
        <article className="glow-panel status-card">
          <h2>Status API</h2>
          <p className="status-value">{health?.status ?? "..."}</p>
          <p className="text-muted">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : "en attente de reponse"}</p>
        </article>
        <article className="glow-panel status-card">
          <h2>Jobs en file</h2>
          <p className="status-value">0</p>
          <p className="text-muted">Interface de suivi en cours de conception</p>
        </article>
        <article className="glow-panel status-card">
          <h2>Modeles mis en avant</h2>
          <ul className="model-list">
            {featuredModels.map((model) => (
              <li key={model.id}>
                <span>{model.name}</span>
                <small>{model.task}</small>
              </li>
            ))}
            {featuredModels.length === 0 && <li className="text-muted">Chargement...</li>}
          </ul>
        </article>
      </section>
    </div>
  );
}
