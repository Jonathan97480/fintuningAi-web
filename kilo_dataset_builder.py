#!/usr/bin/env python3
import os
import sys
import json
import argparse
import tempfile
import subprocess
from pathlib import Path
from tqdm import tqdm
import requests

# Extensions considérées comme code utile
VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".json", ".md"]

def clone_repo(repo_url, debug=False):
    """
    Clone un dépôt GitHub dans un répertoire temporaire et renvoie le chemin local.
    """
    tmpdir = tempfile.mkdtemp()
    if debug:
        print(f"[DEBUG] Clonage du repo {repo_url} dans {tmpdir}")
    try:
        subprocess.run(["git", "clone", "--depth", "1", repo_url, tmpdir], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du clonage du repo {repo_url}: {e}", file=sys.stderr)
        sys.exit(1)
    return tmpdir

def collect_files(repo_path, max_files=200, debug=False):
    """
    Parcours récursivement un dépôt local et retourne une liste de fichiers valides.
    """
    files = []
    for root, _, filenames in os.walk(repo_path):
        for fname in filenames:
            if any(fname.endswith(ext) for ext in VALID_EXTENSIONS):
                fpath = Path(root) / fname
                if fpath.stat().st_size < 200_000:  # éviter les gros fichiers
                    files.append(fpath)
                elif debug:
                    print(f"[DEBUG] Fichier ignoré (trop gros): {fpath}")
    return files[:max_files]

def build_examples(files, inject_mcp=False, debug=False):
    """
    Transforme une liste de fichiers en exemples {prompt, completion}.
    """
    examples = []
    for fpath in files:
        try:
            content = fpath.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            if debug:
                print(f"[DEBUG] Impossible de lire {fpath}: {e}")
            continue
        ex = {
            "prompt": f"Écris ou explique le contenu du fichier {fpath.name}",
            "completion": content
        }
        if inject_mcp:
            ex["mcp"] = {"tool": "kilo-code", "version": "1.0"}
        examples.append(ex)
    return examples

def save_dataset(examples, out_dir):
    """
    Sauvegarde le dataset en train/valid/test (80/10/10).
    """
    n = len(examples)
    train, valid, test = (
        examples[: int(n * 0.8)],
        examples[int(n * 0.8): int(n * 0.9)],
        examples[int(n * 0.9):],
    )
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    with open(Path(out_dir) / "train.jsonl", "w", encoding="utf-8") as f:
        for ex in train:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
    with open(Path(out_dir) / "valid.jsonl", "w", encoding="utf-8") as f:
        for ex in valid:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
    with open(Path(out_dir) / "test.jsonl", "w", encoding="utf-8") as f:
        for ex in test:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"✅ Dataset généré ({n} exemples) dans {out_dir}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-url", help="URL GitHub d'un dépôt spécifique à cloner et utiliser")
    ap.add_argument("--max-files-per-repo", type=int, default=200)
    ap.add_argument("--max-examples", type=int, default=500)
    ap.add_argument("--out-dir", default="./out_dataset")
    ap.add_argument("--inject-mcp", action="store_true", help="Injecter un champ MCP factice")
    ap.add_argument("--debug", action="store_true", help="Afficher des logs détaillés")
    args = ap.parse_args()

    if not args.repo_url:
        print("❌ Vous devez fournir --repo-url (URL du dépôt GitHub).", file=sys.stderr)
        sys.exit(1)

    repo_path = clone_repo(args.repo_url, debug=args.debug)
    files = collect_files(repo_path, args.max_files_per_repo, debug=args.debug)
    examples = build_examples(files, inject_mcp=args.inject_mcp, debug=args.debug)

    if not examples:
        print("⚠️ Aucun exemple collecté.")
        # Génère quand même des fichiers vides pour la suite
        for split in ["train.jsonl", "valid.jsonl", "test.jsonl"]:
            Path(args.out_dir, split).write_text("")
        sys.exit(0)

    # Limiter si trop d'exemples
    examples = examples[: args.max_examples]
    save_dataset(examples, args.out_dir)

if __name__ == "__main__":
    main()
