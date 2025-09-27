import { JobStatus } from "shared";

export const statusLabels: Record<JobStatus, string> = {
  pending: "En attente",
  queued: "En file",
  running: "En cours",
  paused: "En pause",
  completed: "Termine",
  failed: "Echec",
  cancelled: "Annule",
};
