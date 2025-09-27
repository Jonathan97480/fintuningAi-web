import json
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.progress import Progress

from .jobs.dataset import build_dataset
from .jobs.fine_tune import launch_fine_tune

console = Console()


@click.group()
def app() -> None:
    """CLI pour piloter les workers fintuning."""


@app.command()
@click.option("--config", type=click.Path(exists=True), required=True, help="Fichier JSON contenant les hyperparametres.")
@click.option("--output-dir", type=click.Path(), default="artifacts", show_default=True)
def fine_tune(config: str, output_dir: str) -> None:
    """Lancer un job de fine-tuning a partir d'un fichier de configuration."""
    payload = json.loads(Path(config).read_text(encoding="utf-8"))
    with Progress() as progress:
        task = progress.add_task("Telechargement / Execution", total=None)
        launch_fine_tune(payload, Path(output_dir), progress, task)
        progress.update(task, advance=100, total=100)
    console.print("[bold green]Job termine[/bold green]")


@app.command()
@click.option("--repo", help="URL du depot Git a aspirer pour fabriquer le dataset.")
@click.option("--dataset", help="Nom du dataset Hugging Face a telecharger.")
@click.option("--max-examples", type=int, default=1000, show_default=True)
@click.option("--out", type=click.Path(), default="artifacts/datasets", show_default=True)
def dataset(repo: Optional[str], dataset: Optional[str], max_examples: int, out: str) -> None:
    """Generer un dataset selon les parametres fournis."""
    if not repo and not dataset:
        raise click.UsageError("Specifiez --repo ou --dataset")
    Path(out).mkdir(parents=True, exist_ok=True)
    build_dataset(repo=repo, dataset_name=dataset, max_examples=max_examples, output=Path(out))
    console.print("[bold green]Dataset pret[/bold green]")


if __name__ == "__main__":
    app()
