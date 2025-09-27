\"use client\";

import { useState } from \"react\";
import { useRouter } from \"next/navigation\";
import { z } from \"zod\";
import { useCreateFineTuneJobMutation } from \"@/lib/api/base\";
import type { FineTuneJobInput } from \"shared\";

const formSchema = z.object({
  outputName: z.string().min(3, "Nom trop court"),
  baseModelId: z.string().min(1, "Modele obligatoire"),
  datasetId: z.string().min(1, "Dataset obligatoire"),
  numExamples: z.coerce.number().int().positive(),
  maxSteps: z.coerce.number().int().positive(),
  quantizations: z.array(z.string()).nonempty(),
});

const defaultValues: FineTuneJobInput = {
  outputName: "demo-job",
  baseModelId: "Qwen/Qwen2.5-Coder-3B-Instruct",
  datasetId: "custom-dataset",
  numExamples: 500,
  maxSteps: 100,
  quantizations: ["fp16"],
};

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [createJob, { isLoading }] = useCreateFineTuneJobMutation();

  const handleChange = (key: keyof FineTuneJobInput, value: string) => {
    if (key === "quantizations") {
      setForm((prev) => ({ ...prev, quantizations: value.split(",").map((item) => item.trim()).filter(Boolean) }));
    } else if (key === "numExamples" || key === "maxSteps") {
      setForm((prev) => ({ ...prev, [key]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      Object.entries(parsed.error.formErrors.fieldErrors).forEach(([key, [first]]) => {
        if (first) fieldErrors[key] = first;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const result = await createJob(parsed.data).unwrap();
      setMessage("Job cree avec succes");
      setErrors({});
      router.push(/jobs/);
    } catch (error) {
      setMessage((error as Error).message ?? "Erreur lors de la creation du job");
    }
  };

  return (
    <div className="page new-job">
      <header className="page-header">
        <div>
          <p className="badge">Orchestration</p>
          <h1>Lancer un job de fine-tuning</h1>
          <p className="text-muted">Renseignez les parametres principaux pour mettre en file un job BullMQ.</p>
        </div>
      </header>

      <form className="glow-panel job-form" onSubmit={handleSubmit}>
        <label>
          <span>Nom du job</span>
          <input
            value={form.outputName}
            onChange={(event) => handleChange("outputName", event.target.value)}
          />
          {errors.outputName && <small className="error">{errors.outputName}</small>}
        </label>

        <label>
          <span>Modele base</span>
          <input
            value={form.baseModelId}
            onChange={(event) => handleChange("baseModelId", event.target.value)}
          />
          {errors.baseModelId && <small className="error">{errors.baseModelId}</small>}
        </label>

        <label>
          <span>Dataset</span>
          <input value={form.datasetId} onChange={(event) => handleChange("datasetId", event.target.value)} />
          {errors.datasetId && <small className="error">{errors.datasetId}</small>}
        </label>

        <label>
          <span>Nombre d'exemples</span>
          <input
            type="number"
            min={1}
            value={form.numExamples}
            onChange={(event) => handleChange("numExamples", event.target.value)}
          />
        </label>

        <label>
          <span>Nombre de steps</span>
          <input
            type="number"
            min={1}
            value={form.maxSteps}
            onChange={(event) => handleChange("maxSteps", event.target.value)}
          />
        </label>

        <label>
          <span>Quantizations</span>
          <input
            value={form.quantizations.join(", ")}
            onChange={(event) => handleChange("quantizations", event.target.value)}
            placeholder="fp16, nf4"
          />
        </label>

        {message && <p className="form-message">{message}</p>}

        <button className="button-primary" type="submit" disabled={isLoading}>
          {isLoading ? "Envoi..." : "Ajouter a la file"}
        </button>
      </form>
    </div>
  );
}
