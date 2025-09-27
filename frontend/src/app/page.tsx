import Link from \"next/link\";

const quickLinks = [
  { label: \"Lancer un fine-tuning\", href: \"/jobs/new\" },
  { label: \"Parcourir les datasets\", href: \"/datasets\" },
  { label: \"Catalogue modeles\", href: \"/models\" },
  { label: \"Historique des jobs\", href: \"/jobs\" },
];

export default function Home() {
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
          <h2>Workers actifs</h2>
          <p className="status-value">3</p>
          <p className="text-muted">Monitoring temps reel a venir</p>
        </article>
        <article className="glow-panel status-card">
          <h2>Jobs en file</h2>
          <p className="status-value">0</p>
          <p className="text-muted">Interface de suivi en cours de conception</p>
        </article>
        <article className="glow-panel status-card">
          <h2>Derniere synchro HF</h2>
          <p className="status-value">Planifiee</p>
          <p className="text-muted">Les scripts seront connectes en Phase 2</p>
        </article>
      </section>
    </div>
  );
}
