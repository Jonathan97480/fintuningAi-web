\"use client\";

import { FormEvent, useMemo, useState } from \"react\";
import { useSearchDatasetsQuery } from \"@/lib/api/base\";

interface SearchState {
  q: string;
  task: string;
  license: string;
}

const defaultState: SearchState = {
  q: "",
  task: "",
  license: "",
};

export default function DatasetsPage() {
  const [form, setForm] = useState(defaultState);
  const [params, setParams] = useState<SearchState | null>(null);
  const { data, isFetching } = useSearchDatasetsQuery(params ?? undefined, {
    skip: params === null,
  });

  const results = useMemo(() => data?.results ?? [], [data?.results]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParams((prev) => ({ ...prev, ...form }));
  };

  return (
    <div className="page datasets-page">
      <header className="page-header">
        <div>
          <p className="badge">Datasets</p>
          <h1>Recherche Hugging Face</h1>
          <p className="text-muted">
            Filtrez les datasets et identifiez ceux necessitant votre token personnel.
          </p>
        </div>
      </header>

      <form className="glow-panel dataset-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Recherche</span>
            <input
              value={form.q}
              onChange={(event) => setForm({ ...form, q: event.target.value })}
              placeholder="Nom ou mot-cle"
            />
          </label>
          <label>
            <span>Tache</span>
            <input
              value={form.task}
              onChange={(event) => setForm({ ...form, task: event.target.value })}
              placeholder="text-generation, summarization..."
            />
          </label>
          <label>
            <span>Licence</span>
            <input
              value={form.license}
              onChange={(event) => setForm({ ...form, license: event.target.value })}
              placeholder="apache-2.0"
            />
          </label>
        </div>
        <button className="button-primary" type="submit" disabled={isFetching}>
          {isFetching ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      <section className="dataset-results">
        {results.map((dataset) => (
          <article key={dataset.id} className="glow-panel dataset-card">
            <header>
              <h2>{dataset.name}</h2>
              {dataset.locked && <span className="locked">🔒 Token requis</span>}
            </header>
            <p className="text-muted">{dataset.description ?? "Aucune description."}</p>
            <footer>
              <span>Taille approx. : {(dataset.size / 1024).toFixed(1)} ko</span>
            </footer>
          </article>
        ))}
        {params && !isFetching && results.length === 0 && (
          <p className="text-muted">Aucun dataset trouve pour ces filtres.</p>
        )}
        {!params && <p className="text-muted">Renseignez un mot-cle pour commencer.</p>}
      </section>
    </div>
  );
}
