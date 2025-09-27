import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict

import click
from rich.progress import Progress


def launch_fine_tune(payload: Dict[str, Any], output_dir: Path, progress: Progress, task_id: Any) -> None:
    """Lance un job de fine-tuning en utilisant les scripts Python existants.

    Args:
        payload: Configuration du job (modèle, dataset, paramètres)
        output_dir: Répertoire de sortie pour les artefacts
        progress: Objet Progress de rich pour les mises à jour
        task_id: ID de la tâche de progression
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Extraire les paramètres du payload
    base_model = payload.get("baseModelId", "Qwen/Qwen2.5-Coder-3B-Instruct")
    dataset_id = payload.get("datasetId", "")
    num_examples = payload.get("numExamples", 1000)
    max_steps = payload.get("maxSteps", 500)
    output_name = payload.get("outputName", "fine_tuned_model")

    progress.update(task_id, advance=10)
    progress.update(task_id, description="Configuration du fine-tuning...")

    # Créer un fichier de configuration temporaire
    config_file = output_dir / "fine_tune_config.json"
    config = {
        "model_name": base_model,
        "dataset_path": f"./datasets/{dataset_id}",
        "output_dir": str(output_dir / output_name),
        "max_steps": max_steps,
        "num_examples": num_examples,
        "batch_size": 2,
        "learning_rate": 2e-4,
    }

    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    progress.update(task_id, advance=20)
    progress.update(task_id, description="Lancement du script de fine-tuning...")

    try:
        # Utiliser le script fine_tune_3b.py existant
        script_path = Path(__file__).parent.parent.parent.parent.parent / "fine_tune_3b.py"

        if not script_path.exists():
            raise FileNotFoundError(f"Script non trouvé: {script_path}")

        # Lancer le processus Python
        env = os.environ.copy()
        env["PYTHONPATH"] = str(script_path.parent)

        process = subprocess.Popen(
            [sys.executable, str(script_path)],
            cwd=script_path.parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
        )

        # Lire la sortie en temps réel
        while True:
            output = process.stdout.readline()
            if output == "" and process.poll() is not None:
                break
            if output:
                # Analyser la sortie pour estimer la progression
                if "Démarrage de l'entraînement" in output:
                    progress.update(task_id, advance=30, description="Entraînement en cours...")
                elif "Modèle fine-tuné sauvegardé" in output:
                    progress.update(task_id, advance=40, description="Sauvegarde du modèle...")

        return_code = process.poll()
        if return_code != 0:
            raise subprocess.CalledProcessError(return_code, str(script_path))

        progress.update(task_id, advance=30, description="Fine-tuning terminé avec succès")

    except Exception as e:
        progress.update(task_id, description=f"Erreur: {str(e)}")
        raise

    finally:
        # Nettoyer le fichier de config temporaire
        if config_file.exists():
            config_file.unlink()
