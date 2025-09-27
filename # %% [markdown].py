# %% [markdown]
# # 🚀 Fine-tuning Kilo Code (générique) avec Qwen2.5-Coder-7B-Instruct
# 
# Ce notebook propose un pipeline *générique* pour fine-tuner un LLM (par défaut **Qwen2.5-Coder-7B-Instruct**) sur des jeux de données code/web **text-only**.
# 
# Fonctions clés :
# - **Loaders génériques** via une classe abstraite (patron) + implémentations :
#   - `RepoUrlLoader` (clonage d'un dépôt GitHub)
#   - `StackSmolLoader` (dataset Hugging Face : `bigcode/the-stack-smol`)
# - **Prétraitement optionnel** (`USE_TOKENIZATION`) qui convertit `(prompt, completion)` en `input_ids/labels` pour Causal LM.
# - **QLoRA** (quantization 4-bit propre via `BitsAndBytesConfig`).
# - Entraînement, sauvegarde et test rapide.
# 
# **Remarque licences/données :** si vous utilisez des sources externes (GitHub/HF), respectez leurs licences/conditions.
# 

# %%
!pip install -q --upgrade pip
!pip install -q transformers datasets peft accelerate bitsandbytes tqdm

# %%
import os, sys, json, subprocess, tempfile, shutil, random
from pathlib import Path
from typing import List, Dict
from abc import ABC, abstractmethod
from loaders.dataset_loader_base import DatasetLoaderBase
from loaders.dataset_loaders_impl import RepoUrlLoader, StackSmolLoader
from huggingface_hub import login
login(token="YOUR_HUGGINGFACE_TOKEN_HERE")


import torch
print("CUDA dispo:", torch.cuda.is_available())
if torch.cuda.is_available():
    print(torch.cuda.get_device_name(0))
    print(round(torch.cuda.get_device_properties(0).total_memory/1024**3,2), "GB VRAM")

# %% [markdown]
# ## ⚙️ Configuration générale
# - `DATA_SOURCE`: choisissez `"repo_url"` ou `"stack_smol"`.
# - `USE_TOKENIZATION`: `True` conseillé pour les modèles Causal LM.
# - `MAX_EXAMPLES`: nombre maximum d'exemples à générer depuis le dataset.
# - `MAX_STEPS`: nombre maximum de steps d'entraînement (None = entraînement complet sur toutes les époques).
# - `NUM_TRAIN_EPOCHS`: nombre d'époques si MAX_STEPS=None.
# - Ajustez `MAX_FILES_PER_REPO`, etc.

# %%
# 📂 Répertoires dataset
DATASET_DIR = Path("./out_dataset")
DATASET_DIR.mkdir(parents=True, exist_ok=True)
TRAIN_FILE = DATASET_DIR / "train.jsonl"
VALID_FILE = DATASET_DIR / "valid.jsonl"
TEST_FILE  = DATASET_DIR / "test.jsonl"
STACK_SMOL_LANGS = None

# 🌐 Sélection de la source de données ("repo_url" ou "stack_smol")
DATA_SOURCE = "stack_smol"  # ⬅️ change en "stack_smol" pour utiliser the-stack-smol

# 🔗 Paramètres pour RepoUrlLoader
REPO_URL = "https://github.com/sidikfaha/nextjs-complete-starter-template"
MAX_FILES_PER_REPO = 400

# 📦 Paramètres communs dataset
MAX_EXAMPLES = 2000  # nombre max d'exemples générés
DEBUG = True
INJECT_MCP = True

# 🏃 Paramètres d'entraînement
MAX_STEPS = None  # nombre max de steps (None = entraînement complet sur toutes les époques, -1 en interne)
NUM_TRAIN_EPOCHS = 3  # nombre d'époques si MAX_STEPS=None
# 💡 Exemples d'utilisation :
# MAX_STEPS = 100  # arrêter après 100 steps (entraînement rapide pour test)
# MAX_STEPS = None; NUM_TRAIN_EPOCHS = 3  # entraînement complet sur 3 époques

# 🧪 Prétraitement (tokenization) pour Causal LM
USE_TOKENIZATION = True  # passer à False si vous avez un autre formalisme de dataset

# 🧰 Langages web à retenir pour the-stack-smol
STACK_SMOL_LANGS = ["javascript", "typescript", "html", "css"]

# 🔢 Découpage 80/10/10
SPLIT_RATIOS = (0.8, 0.1, 0.1)

random.seed(42)

# %% [markdown]
# ## 🧱 Patron de loaders (classe abstraite) + implémentations
# Chaque loader doit implémenter `fetch()` et `transform_to_examples()` pour retourner des `[{prompt, completion, ...}, ...]`.
# La méthode commune `save_splits()` écrit `train/valid/test` en JSONL.

# %%
class DatasetLoaderBase(ABC):
    def __init__(self, out_dir: Path, inject_mcp: bool = False, debug: bool = False,
                 max_examples: int = 1000):
        self.out_dir = out_dir
        self.inject_mcp = inject_mcp
        self.debug = debug
        self.max_examples = max_examples
        self.out_dir.mkdir(parents=True, exist_ok=True)

    @abstractmethod
    def fetch(self):
        """Télécharge/charge les données brutes (git clone, HF load, etc.)."""
        pass

    @abstractmethod
    def transform_to_examples(self) -> List[Dict]:
        """Transforme les données brutes en liste de dicts {prompt, completion, ...}."""
        pass

    def save_splits(self, examples: List[Dict], ratios=(0.8, 0.1, 0.1)):
        n = len(examples)
        if self.debug:
            print(f"[DEBUG] Total exemples préparés: {n}")
        if n == 0:
            # fichiers vides pour ne pas bloquer le pipeline
            for split in ["train.jsonl", "valid.jsonl", "test.jsonl"]:
                (self.out_dir / split).write_text("")
            return

        # shuffle pour un split stable
        exs = examples[:]
        random.shuffle(exs)
        r_train, r_valid, r_test = ratios
        n_train = int(n * r_train)
        n_valid = int(n * (r_train + r_valid))
        splits = {
            "train": exs[:n_train],
            "valid": exs[n_train:n_valid],
            "test": exs[n_valid:]
        }
        import json
        for split, arr in splits.items():
            with open(self.out_dir / f"{split}.jsonl", "w", encoding="utf-8") as f:
                for ex in arr:
                    f.write(json.dumps(ex, ensure_ascii=False) + "\n")
        if self.debug:
            print(f"[DEBUG] Sauvegardé → train={len(splits['train'])}, valid={len(splits['valid'])}, test={len(splits['test'])}")


class RepoUrlLoader(DatasetLoaderBase):
    VALID_EXT = [".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".html", ".css"]
    def __init__(self, repo_url: str, out_dir: Path, inject_mcp=False, debug=False,
                 max_files=400, max_examples=1000):
        super().__init__(out_dir, inject_mcp, debug, max_examples)
        self.repo_url = repo_url
        self.max_files = max_files
        self.local_path = None

    def fetch(self):
        tmp = tempfile.mkdtemp()
        if self.debug:
            print(f"[DEBUG] git clone --depth 1 {self.repo_url} → {tmp}")
        subprocess.run(["git", "clone", "--depth", "1", self.repo_url, tmp], check=True)
        self.local_path = Path(tmp)

    def transform_to_examples(self) -> List[Dict]:
        files = []
        for root, _, fnames in os.walk(self.local_path):
            for fname in fnames:
                if any(fname.endswith(ext) for ext in self.VALID_EXT):
                    fpath = Path(root) / fname
                    try:
                        if fpath.stat().st_size < 300_000:  # évite gros fichiers
                            files.append(fpath)
                    except Exception:
                        continue
        files = files[: self.max_files]
        examples = []
        for f in files:
            try:
                text = f.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                if self.debug:
                    print(f"[DEBUG] Lecture impossible {f}: {e}")
                continue
            obj = {
                "prompt": f"Contenu du fichier {f.name} : explique, améliore ou complète.",
                "completion": text
            }
            if self.inject_mcp:
                obj["mcp"] = {"tool": "kilo-code", "version": "1.0"}
            examples.append(obj)
            if len(examples) >= self.max_examples:
                break
        return examples


class StackSmolLoader(DatasetLoaderBase):
    def __init__(self, out_dir: Path, inject_mcp=False, debug=False,
                 keep_langs=STACK_SMOL_LANGS, max_examples=1000):
        super().__init__(out_dir, inject_mcp, debug, max_examples)
        self.keep_langs = keep_langs
        self.ds = None
        self.local_dataset_dir = Path("./datasets/the-stack-smol")

    def fetch(self):
        from datasets import load_dataset
        import requests
        
        # Vérifier si le cache local existe
        if self.local_dataset_dir.exists():
            print("📂 Dataset trouvé en local →", self.local_dataset_dir)
            # Charger depuis le cache local
            from datasets import load_from_disk
            self.ds = load_from_disk(str(self.local_dataset_dir))
        else:
            print("🌐 Vérification de la taille du dataset the-stack-smol...")
            
            # Vérifier la taille du dataset sur Hugging Face
            try:
                response = requests.get("https://huggingface.co/api/datasets/bigcode/the-stack-smol", timeout=10)
                if response.status_code == 200:
                    dataset_info = response.json()
                    # Calculer la taille approximative (en Go)
                    size_gb = sum(split.get("size", 0) for split in dataset_info.get("splits", {}).values()) / (1024**3)
                    print(f"📊 Taille estimée du dataset: {size_gb:.2f} Go")
                    
                    if size_gb > 5.0:
                        print("🚀 Dataset > 5Go, utilisation du mode streaming...")
                        self.ds = load_dataset("bigcode/the-stack-smol", streaming=True)["train"]
                        self.streaming_mode = True
                    else:
                        print("💾 Dataset ≤ 5Go, téléchargement complet...")
                        os.makedirs("./datasets", exist_ok=True)
                        self.ds = load_dataset("bigcode/the-stack-smol", cache_dir=str(self.local_dataset_dir))["train"]
                        # Sauvegarder localement pour les futures utilisations
                        self.ds.save_to_disk(str(self.local_dataset_dir))
                        print("✅ Dataset téléchargé et sauvegardé dans", self.local_dataset_dir)
                        self.streaming_mode = False
                else:
                    raise Exception("Impossible de récupérer les infos du dataset")
            except Exception as e:
                print(f"⚠️ Impossible de vérifier la taille ({e}), utilisation du mode normal...")
                os.makedirs("./datasets", exist_ok=True)
                self.ds = load_dataset("bigcode/the-stack-smol", cache_dir=str(self.local_dataset_dir))["train"]
                self.ds.save_to_disk(str(self.local_dataset_dir))
                self.streaming_mode = False
        
        # Appliquer les filtres de langues (uniquement si pas en streaming)
        if self.keep_langs and not getattr(self, 'streaming_mode', False):
            keep_langs_lower = [lang.lower() for lang in self.keep_langs]
            self.ds = self.ds.filter(lambda ex: ex.get("lang", "").lower() in keep_langs_lower)
        elif self.keep_langs and getattr(self, 'streaming_mode', False):
            print("ℹ️ Mode streaming: filtrage des langues appliqué lors de la transformation")
        
        if self.debug:
            print(self.ds)

    def transform_to_examples(self) -> List[Dict]:
        examples = []
        if self.ds is None:
            return examples
        
        # Préparer le filtrage des langues pour le mode streaming
        keep_langs_lower = [lang.lower() for lang in self.keep_langs] if self.keep_langs else None
        
        # stream/iterate
        for ex in self.ds:
            # Appliquer le filtrage des langues en mode streaming
            if keep_langs_lower and getattr(self, 'streaming_mode', False):
                lang = ex.get("lang", "").lower()
                if lang not in keep_langs_lower:
                    continue
            
            prompt = f"Fichier {ex.get('lang','code')} : analyse, explique ou complète."
            completion = ex.get("content", "")
            obj = {"prompt": prompt, "completion": completion}
            if self.inject_mcp:
                obj["mcp"] = {"tool": "kilo-code", "version": "1.0"}
            examples.append(obj)
            if len(examples) >= self.max_examples:
                break
        return examples


# %% [markdown]
# ## 📥 Génération du dataset (si `train.jsonl` absent)
# Choix automatique du loader selon `DATA_SOURCE`.

# %%
if not TRAIN_FILE.exists():
    print("📥 Dataset absent, génération en cours…")
    if DATA_SOURCE == "repo_url":
        loader = RepoUrlLoader(
            repo_url=REPO_URL,
            out_dir=DATASET_DIR,
            inject_mcp=INJECT_MCP,
            debug=DEBUG,
            max_files=MAX_FILES_PER_REPO,
            max_examples=MAX_EXAMPLES,
        )
    elif DATA_SOURCE == "stack_smol":
        loader = StackSmolLoader(
            out_dir=DATASET_DIR,
            inject_mcp=INJECT_MCP,
            debug=DEBUG,
            keep_langs=STACK_SMOL_LANGS,
            max_examples=MAX_EXAMPLES,
        )
    else:
        raise ValueError("DATA_SOURCE invalide (choisir 'repo_url' ou 'stack_smol')")

    try:
        loader.fetch()
        examples = loader.transform_to_examples()
        loader.save_splits(examples, ratios=SPLIT_RATIOS)
        print("✅ Dataset généré →", DATASET_DIR)
    except Exception as e:
        print("⚠️ Erreur génération dataset:", e)
        for f in [TRAIN_FILE, VALID_FILE, TEST_FILE]:
            f.write_text("")
else:
    print("✅ Dataset déjà présent, on passe directement au fine-tuning.")

# %% [markdown]
# ## 📦 Chargement du dataset JSONL

# %%
from datasets import load_dataset
dataset = load_dataset("json", data_files={
    "train": str(TRAIN_FILE),
    "validation": str(VALID_FILE),
    "test": str(TEST_FILE)
})
dataset

# %% [markdown]
# ## 🧠 Chargement du modèle (QLoRA 4-bit propre)
# Utilise `BitsAndBytesConfig` (recommandé) au lieu de l'argument `load_in_4bit` déprécié.

# %%
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"  # Réf. HF
LOCAL_MODEL_DIR = "./models/Qwen2.5-Coder-7B-Instruct"

# Forcer le téléchargement et stockage local du modèle
if not os.path.exists(LOCAL_MODEL_DIR):
    print("🌐 Téléchargement du modèle depuis Hugging Face vers le dossier local...")
    os.makedirs("./models", exist_ok=True)
    
    # Télécharger le tokenizer
    tokenizer_temp = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    tokenizer_temp.save_pretrained(LOCAL_MODEL_DIR)
    
    # Télécharger le modèle (sans quantization pour le stockage)
    model_temp = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        trust_remote_code=True,
    )
    model_temp.save_pretrained(LOCAL_MODEL_DIR)
    
    print("✅ Modèle téléchargé et sauvegardé dans", LOCAL_MODEL_DIR)
else:
    print("📂 Modèle trouvé en local →", LOCAL_MODEL_DIR)

# Utiliser toujours le modèle local
model_path = LOCAL_MODEL_DIR

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float16,
)

tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    device_map="auto",
    trust_remote_code=True,
    quantization_config=bnb_config,
)
print("✅ Modèle prêt")

# %% [markdown]
# ## 🧪 Prétraitement optionnel (tokenization)
# Activez/désactivez via `USE_TOKENIZATION`.

# %%
if USE_TOKENIZATION:
    def tokenize_function(examples):
        texts = [ (p or "") + "\n" + (c or "") for p, c in zip(examples.get("prompt", [""]*len(examples["completion"])),
                                                                  examples.get("completion", [""]))]
        model_inputs = tokenizer(texts, max_length=256, truncation=True, padding=True)
        model_inputs["labels"] = model_inputs["input_ids"].copy()
        return model_inputs

    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset["train"].column_names)
else:
    tokenized_dataset = dataset  # laisser brut si vous avez un autre collator/custom forward

tokenized_dataset

# %% [markdown]
# ## 🪡 Appliquer LoRA (PEFT)

# %%
from peft import LoraConfig, get_peft_model
lora_config = LoraConfig(
    r=8, lora_alpha=16, lora_dropout=0.05,
    target_modules=["q_proj","v_proj"],
    bias="none", task_type="CAUSAL_LM"
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# %% [markdown]
# ## 🏃 Entraînement (Trainer)
# Note : `remove_unused_columns=False` est important quand on alimente directement `input_ids/labels`.

# %%
from transformers import TrainingArguments, Trainer, DataCollatorForLanguageModeling

training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    max_steps=MAX_STEPS if MAX_STEPS is not None else -1,  # -1 = entraînement complet
    num_train_epochs=NUM_TRAIN_EPOCHS if MAX_STEPS is None else 1,  # époques si pas de max_steps
    learning_rate=2e-4,
    fp16=torch.cuda.is_available(),
    logging_steps=10,
    save_steps=100,
    save_total_limit=2,
    eval_strategy="epoch",
    per_device_eval_batch_size=1,
    remove_unused_columns=False,
)

data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
    data_collator=data_collator,
)
trainer.train()

# %% [markdown]
# ## 💾 Sauvegarde de l'adaptateur LoRA + tokenizer

# %%
OUTPUT_DIR = "./kilo_code_qwen_lora"
Path(OUTPUT_DIR).mkdir(exist_ok=True)
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print("✅ Sauvegardé dans", OUTPUT_DIR)

# %% [markdown]
# ## 🧪 Test rapide (génération)
# Augmentez `max_new_tokens` pour des snippets plus longs.

# %%
from transformers import pipeline
pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, device_map="auto")
res = pipe("Crée une page Next.js avec un formulaire de contact", max_new_tokens=300, temperature=0.7, top_p=0.9)
print(res[0]['generated_text'])

# %%
# =====================================================================
# 🚀 Conversion d’un modèle HF (fine-tuné) vers GGUF 4-bit (Q4_K_M)
# Compatible LM Studio, llamafile, ollama, koboldcpp, etc.
# =====================================================================

import os
import subprocess
import torch

# 📂 Chemin vers ton modèle fine-tuné Hugging Face/PEFT
HF_MODEL_PATH = "./kilo_code_qwen_lora"   # <-- adapte si besoin

MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"  # Réf. HF
LOCAL_MODEL_DIR = "./models/Qwen2.5-Coder-7B-Instruct"

if os.path.exists(LOCAL_MODEL_DIR):
    print("📂 Modèle de base trouvé en local →", LOCAL_MODEL_DIR)
    base_model_path = LOCAL_MODEL_DIR
else:
    print("🌐 Téléchargement du modèle de base depuis Hugging Face…")
    base_model_path = MODEL_NAME

# 📂 Chemin de sortie GGUF
GGUF_OUT_DIR = "./gguf_export"
os.makedirs(GGUF_OUT_DIR, exist_ok=True)

# 🏷️ Nom du modèle converti
GGUF_MODEL_NAME = "kilo_code_qwen2.5_4b_q4km.gguf"

# =====================================================================
# ⚙️ Étape préalable : fusion du modèle LoRA avec le modèle de base
# =====================================================================

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

print("🔄 Fusion du modèle LoRA avec le modèle de base...")

# Charger le tokenizer
tokenizer = AutoTokenizer.from_pretrained(base_model_path)

# Charger le modèle de base
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_path,  # Utiliser le chemin local si disponible
    torch_dtype=torch.float16,
    device_map="auto",  # Utiliser CPU et GPU pour accélérer le chargement
    low_cpu_mem_usage=True,
)

# Charger l'adaptateur LoRA
model = PeftModel.from_pretrained(base_model, HF_MODEL_PATH)

# Fusionner
merged_model = model.merge_and_unload()

import gc
gc.collect()

# Sauvegarder le modèle fusionné
MERGED_MODEL_PATH = "./merged_model"
merged_model.save_pretrained(MERGED_MODEL_PATH, max_shard_size="1GB")
tokenizer.save_pretrained(MERGED_MODEL_PATH)

print("✅ Modèle fusionné sauvegardé dans", MERGED_MODEL_PATH)

# =====================================================================
# ⚙️ Conversion via llama.cpp (fichiers binaires nécessaires)
# Tu dois avoir cloné et compilé llama.cpp :
# git clone https://github.com/ggerganov/llama.cpp
# cd llama.cpp && mkdir build && cd build && cmake .. && make -j
# =====================================================================

LLAMA_CPP_CONVERT = "./llama.cpp/convert_hf_to_gguf.py"
LLAMA_CPP_QUANTIZE = "./llama.cpp/build/bin/quantize"

# Étape 1 : conversion du modèle HF → format f16 (intermédiaire)
cmd_convert = [
    "python", LLAMA_CPP_CONVERT,
    MERGED_MODEL_PATH,
    "--outfile", os.path.join(GGUF_OUT_DIR, "model-f16.gguf"),
    "--outtype", "f16"
]
print("🔄 Conversion HF → GGUF f16...")
subprocess.run(cmd_convert, check=True)

# Étape 2 : quantization f16 → Q4_K_M
cmd_quant = [
    LLAMA_CPP_QUANTIZE,
    os.path.join(GGUF_OUT_DIR, "model-f16.gguf"),
    os.path.join(GGUF_OUT_DIR, GGUF_MODEL_NAME),
    "Q4_K_M"
]
print("🔄 Quantization vers Q4_K_M...")
subprocess.run(cmd_quant, check=True)

print(f"✅ Conversion terminée → {os.path.join(GGUF_OUT_DIR, GGUF_MODEL_NAME)}")



