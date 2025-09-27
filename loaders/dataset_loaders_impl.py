# loaders/dataset_loaders_impl.py

import os
import subprocess
import tempfile
from pathlib import Path
from loaders.dataset_loader_base import DatasetLoaderBase
from datasets import load_dataset

class RepoUrlLoader(DatasetLoaderBase):
    VALID_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".html", ".css"]

    def __init__(self,
                 repo_url: str,
                 out_dir: Path,
                 inject_mcp: bool = False,
                 debug: bool = False,
                 max_files: int = 300,
                 max_examples: int = 1000):
        super().__init__(out_dir, inject_mcp, debug, max_examples)
        self.repo_url = repo_url
        self.max_files = max_files
        self.local_path: Path | None = None

    def fetch(self):
        tmp = tempfile.mkdtemp()
        if self.debug:
            print(f"[DEBUG] Clonage {self.repo_url} → {tmp}")
        subprocess.run(["git", "clone", "--depth", "1", self.repo_url, tmp], check=True)
        self.local_path = Path(tmp)

    def transform_to_examples(self):
        examples = []
        if self.local_path is None:
            if self.debug:
                print("[DEBUG] Pas de local_path, fetch() non exécuté.")
            return examples

        files = []
        for root, _, fnames in os.walk(self.local_path):
            for fname in fnames:
                for ext in self.VALID_EXTENSIONS:
                    if fname.endswith(ext):
                        fpath = Path(root) / fname
                        try:
                            size = fpath.stat().st_size
                        except Exception:
                            continue
                        # filtre les fichiers d’une taille raisonnable
                        if size < 300_000:
                            files.append(fpath)
                        elif self.debug:
                            print(f"[DEBUG] Ignoré (trop gros) : {fpath} taille {size}")
                        break

        # limiter le nombre de fichiers
        files = files[: self.max_files]

        for fpath in files:
            try:
                text = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                if self.debug:
                    print(f"[DEBUG] Lecture échouée {fpath}: {e}")
                continue
            obj = {
                "prompt": f"Explique ou complète le fichier {fpath.name} :",
                "completion": text
            }
            if self.inject_mcp:
                obj["mcp"] = {"tool": "kilo-code", "version": "1.0"}
            examples.append(obj)
            if len(examples) >= self.max_examples:
                break

        return examples
    
class StackSmolLoader(DatasetLoaderBase):
    def __init__(self, out_dir: Path, inject_mcp=False, debug=True,
                 keep_langs=None, max_examples=1000):
        super().__init__(out_dir, inject_mcp, debug, max_examples)
        self.keep_langs = keep_langs  # None = pas de filtrage
        self.ds = None

    def fetch(self):
        
        self.ds = load_dataset("bigcode/the-stack-smol", split="train")
        if self.keep_langs:  # filtrage optionnel
            self.ds = self.ds.filter(lambda ex: ex.get("lang") in self.keep_langs)
        if self.debug:
            print(self.ds)
            print(self.ds[0])

    def transform_to_examples(self):
        examples = []
        if self.ds is None:
            return examples

        for ex in self.ds:
            prompt = f"Analyse, explique ou complète ce code ({ex.get('lang','?')})"
            completion = ex.get("content", "")
            obj = {"prompt": prompt, "completion": completion}
            if self.inject_mcp:
                obj["mcp"] = {"tool": "kilo-code", "version": "1.0"}
            examples.append(obj)
            if len(examples) >= self.max_examples:
                break
        return examples
