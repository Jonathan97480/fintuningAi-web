"use client";

import type { DatasetRecord, ProjectRecord } from "shared";
import { FormEvent, useState } from "react";
import {
  useListProjectsQuery,
  useCreateProjectMutation,
  useCreateDatasetMutation,
} from "@/lib/api/base";

const defaultProject = {
  name: "",
  description: "",
};

export default function ProjectsPage() {
  const { data: projects, refetch } = useListProjectsQuery();
  const [createProject, { isLoading: creatingProject }] = useCreateProjectMutation();
  const [createDataset, { isLoading: creatingDataset }] = useCreateDatasetMutation();
  const [projectForm, setProjectForm] = useState(defaultProject);
  const [datasetForms, setDatasetForms] = useState<Record<string, { name: string; hfId: string }>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectForm.name.trim()) return;
    try {
      await createProject({
        name: projectForm.name,
        description: projectForm.description || undefined,
      }).unwrap();
      setProjectForm(defaultProject);
      setMessage("Projet cree");
      refetch();
    } catch (error) {
      setMessage((error as Error).message ?? "Erreur creation projet");
    }
  };

  const handleDatasetSubmit = async (event: FormEvent<HTMLFormElement>, projectId: string) => {
    event.preventDefault();
    const current = datasetForms[projectId];
    if (!current?.name?.trim()) return;
    try {
      await createDataset({
        projectId,
        name: current.name,
        hfId: current.hfId || undefined,
      }).unwrap();
      setDatasetForms((prev) => ({ ...prev, [projectId]: { name: "", hfId: "" } }));
      setMessage("Dataset ajoute");
      refetch();
    } catch (error) {
      setMessage((error as Error).message ?? "Erreur creation dataset");
    }
  };

  return (
    <div className="page projects-page">
      <header className="page-header">
        <div>
          <p className="badge">Projets</p>
          <h1>Gestion des projets & datasets</h1>
          <p className="text-muted">Organise tes jobs par projet et rattache rapidement des datasets.</p>
        </div>
      </header>

      <section className="glow-panel project-form">
        <h2>Nouveau projet</h2>
        <form onSubmit={handleProjectSubmit}>
          <label>
            <span>Nom</span>
            <input
              value={projectForm.name}
              onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
              placeholder="Nom du projet"
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
              placeholder="A propos du projet"
            />
          </label>
          <button className="button-primary" type="submit" disabled={creatingProject}>
            {creatingProject ? "Creation..." : "Ajouter"}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
      </section>

      <section className="projects-grid">
        {(projects ?? []).map((project) => {
          const datasetForm = datasetForms[project.id] ?? { name: "", hfId: "" };
          const datasets = (project as ProjectRecord & { datasets?: DatasetRecord[] }).datasets ?? [];
          return (
            <article key={project.id} className="glow-panel project-card">
              <header>
                <h2>{project.name}</h2>
                <span className="project-date">cree le {new Date(project.createdAt).toLocaleString()}</span>
              </header>
              <p className="text-muted">{project.description ?? "Pas de description"}</p>

              <form className="dataset-inline-form" onSubmit={(event) => handleDatasetSubmit(event, project.id)}>
                <label>
                  <span>Nouveau dataset</span>
                  <input
                    value={datasetForm.name}
                    onChange={(event) =>
                      setDatasetForms((prev) => ({
                        ...prev,
                        [project.id]: { ...datasetForm, name: event.target.value },
                      }))
                    }
                    placeholder="Nom dataset"
                  />
                </label>
                <label>
                  <span>ID Hugging Face</span>
                  <input
                    value={datasetForm.hfId}
                    onChange={(event) =>
                      setDatasetForms((prev) => ({
                        ...prev,
                        [project.id]: { ...datasetForm, hfId: event.target.value },
                      }))
                    }
                    placeholder="org/dataset"
                  />
                </label>
                <button className="ghost-button" type="submit" disabled={creatingDataset}>
                  {creatingDataset ? "Ajout..." : "Ajouter"}
                </button>
              </form>

              <footer>
                <strong>Datasets associes</strong>
                <ul>
                  {datasets.length > 0 ? (
                    datasets.map((dataset) => (
                      <li key={dataset.id}>
                        <span>{dataset.name}</span>
                        {dataset.hfId && <small>{dataset.hfId}</small>}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted">Aucun dataset encore.</li>
                  )}
                </ul>
              </footer>
            </article>
          );
        })}
        {projects && projects.length === 0 && <p className="text-muted">Aucun projet pour le moment.</p>}
      </section>
    </div>
  );
}
