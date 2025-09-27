import subprocess
import sys
from pathlib import Path
from typing import Optional


def build_dataset(*, repo: Optional[str], dataset_name: Optional[str], max_examples: int, output: Path) -> None:
    """Construit un dataset en utilisant le script kilo_dataset_builder.py existant.

    Args:
        repo: URL du dépôt GitHub à cloner
        dataset_name: Nom du dataset Hugging Face (non utilisé pour l'instant)
        max_examples: Nombre maximum d'exemples à générer
        output: Répertoire de sortie pour le dataset
    """
    output.mkdir(parents=True, exist_ok=True)

    if not repo:
        raise ValueError("URL du dépôt GitHub requise (--repo)")

    # Utiliser le script kilo_dataset_builder.py existant
    script_path = Path(__file__).parent.parent.parent.parent.parent / "kilo_dataset_builder.py"

    if not script_path.exists():
        raise FileNotFoundError(f"Script non trouvé: {script_path}")

    # Préparer les arguments pour le script
    cmd = [
        sys.executable,
        str(script_path),
        "--repo-url", repo,
        "--max-examples", str(max_examples),
        "--out-dir", str(output),
        "--debug"  # Activer les logs de debug
    ]

    # Lancer le processus
    result = subprocess.run(
        cmd,
        cwd=script_path.parent,
        capture_output=True,
        text=True,
        check=True
    )

    # Vérifier que les fichiers ont été créés
    expected_files = ["train.jsonl", "valid.jsonl", "test.jsonl"]
    for filename in expected_files:
        if not (output / filename).exists():
            raise FileNotFoundError(f"Fichier dataset manquant: {filename}")

    print(f"Dataset généré avec succès dans {output}")
