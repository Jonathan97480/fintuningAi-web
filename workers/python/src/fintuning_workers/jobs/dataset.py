from pathlib import Path
from typing import Optional


def build_dataset(*, repo: Optional[str], dataset_name: Optional[str], max_examples: int, output: Path) -> None:
    """Placeholder pour la generation de dataset.

    L'integration reelle reutilisera `kilo_dataset_builder.py`. Pour l'instant nous
    creons un fichier texte de demonstration.
    """
    output.mkdir(parents=True, exist_ok=True)
    target = output / "dataset-summary.txt"
    target.write_text(
        f"repo={repo}\ndataset={dataset_name}\nmax_examples={max_examples}\n",
        encoding="utf-8",
    )
