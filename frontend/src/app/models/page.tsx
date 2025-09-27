"use client";

import { useMemo, useState } from "react";
import { useListModelsQuery } from "@/lib/api/base";

export default function ModelsPage() {
  const [task, setTask] = useState<string>("");
  const { data, isFetching } = useListModelsQuery(task ? { task } : undefined);
  const models = useMemo(() => data?.results ?? [], [data?.results]);

  return (
    <div className="page models-page">
      <header className="page-header">
        <div>
          <p className="badge">Catalogue</p>
          <h1>Modeles Hugging Face</h1>
          <p className="text-muted">Synchronisation quotidienne (mock) des modeles compatibles.</p>
        </div>
        <div className="task-filter">
          <label>
            <span>Tache</span>
            <input
              value={task}
              onChange={(event) => setTask(event.target.value)}
              placeholder="text-generation"
            />
          </label>
        </div>
      </header>

      <section className="models-grid">
        {models.map((model) => (
          <article key={model.id} className="glow-panel model-card">
            <h2>{model.name}</h2>
            <p className="text-muted">Tache : {model.task}</p>
            <p className="text-muted">Licence : {model.license ?? "--"}</p>
            <p className="text-muted">Quantization : {model.quantization.join(", ")}</p>
          </article>
        ))}
        {isFetching && <p className="text-muted">Chargement...</p>}
        {!isFetching && models.length === 0 && <p className="text-muted">Aucun modele trouve.</p>}
      </section>
    </div>
  );
}
