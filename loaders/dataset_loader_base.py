# dataset_loader_base.py

from abc import ABC, abstractmethod
from pathlib import Path
import random
import json

class DatasetLoaderBase(ABC):
    def __init__(self,
                 out_dir: Path,
                 inject_mcp: bool = False,
                 debug: bool = False,
                 max_examples: int = 1000):
        """
        Classe de base pour chargement / construction de dataset.
        :param out_dir: dossier de sortie (train.jsonl, valid.jsonl, test.jsonl)
        :param inject_mcp: ajouter champ “mcp” dans les exemples
        :param debug: mode verbose pour logs
        :param max_examples: nombre max d’exemples à générer
        """
        self.out_dir = out_dir
        self.inject_mcp = inject_mcp
        self.debug = debug
        self.max_examples = max_examples
        self.out_dir.mkdir(parents=True, exist_ok=True)

    @abstractmethod
    def fetch(self):
        """
        Récupère / télécharge les données brutes (ex: clone repo, charger dataset HF, etc.)
        """
        pass

    @abstractmethod
    def transform_to_examples(self):
        """
        Transforme les données brutes en liste de dicts {prompt, completion, …}
        """
        pass

    def save_splits(self, examples, ratios=(0.8, 0.1, 0.1)):
        """
        Fractionne les exemples en train/valid/test et les écrit en JSONL.
        Si aucun exemple, crée des fichiers vides.
        """
        n = len(examples)
        if self.debug:
            print(f"[DEBUG] Nombre d'exemples générés : {n}")

        if n == 0:
            # aucun exemple : fichiers vides
            for split in ("train.jsonl", "valid.jsonl", "test.jsonl"):
                (self.out_dir / split).write_text("")
            if self.debug:
                print("[DEBUG] Crée des fichiers JSONL vides.")
            return

        # mélanger
        exs = examples[:]
        random.shuffle(exs)

        r_train, r_valid, r_test = ratios
        idx_train = int(n * r_train)
        idx_valid = int(n * (r_train + r_valid))

        splits = {
            "train": exs[:idx_train],
            "valid": exs[idx_train:idx_valid],
            "test": exs[idx_valid:]
        }

        for split, arr in splits.items():
            path = self.out_dir / f"{split}"
            with open(path, "w", encoding="utf-8") as f:
                for ex in arr:
                    f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        if self.debug:
            print(f"[DEBUG] Écrit splits → train: {len(splits['train'])}, valid: {len(splits['valid'])}, test: {len(splits['test'])}")
