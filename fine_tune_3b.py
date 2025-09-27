#!/usr/bin/env python3#!/usr/bin/env python3

""""""

Script de fine-tuning pour Qwen2.5-Coder avec un modèle plus petitScript alternatif pour fine-tuner Qwen2.5-Coder avec un modèle plus petit

Utilisez ce script si le notebook principal ne fonctionne pas à cause de limitations mémoireUtilisez ce script si le notebook principal ne fonctionne pas à cause de limitations mémoire

""""""



import osimport os

import sysimport torch

import jsonfrom transformers import (

import torch    AutoModelForCausalLM,

import argparse    AutoTokenizer,

from transformers import (    BitsAndBytesConfig,

    AutoModelForCausalLM,    TrainingArguments,

    AutoTokenizer,    Trainer,

    BitsAndBytesConfig,    DataCollatorForLanguageModeling

    TrainingArguments,)

    Trainer,from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    DataCollatorForLanguageModelingfrom datasets import load_dataset

)from pathlib import Path

from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

from datasets import load_datasetdef main():

from pathlib import Path    print("🚀 Fine-tuning Qwen2.5-Coder-3B (version légère)")



def main():    # Configuration pour modèle plus petit

    parser = argparse.ArgumentParser(description="Fine-tune Qwen2.5-Coder-3B")    MODEL_NAME = "Qwen/Qwen2.5-Coder-3B-Instruct"

    parser.add_argument("--config", type=str, help="Fichier JSON de configuration")    LOCAL_MODEL_DIR = "./models/Qwen2.5-Coder-3B-Instruct"

    parser.add_argument("--model-name", type=str, default="Qwen/Qwen2.5-Coder-3B-Instruct",

                       help="Nom du modèle Hugging Face")    # Configuration QLoRA optimisée pour petits modèles

    parser.add_argument("--dataset-path", type=str, required=True,    bnb_config = BitsAndBytesConfig(

                       help="Chemin vers le dataset")        load_in_4bit=True,

    parser.add_argument("--output-dir", type=str, required=True,        bnb_4bit_use_double_quant=True,

                       help="Répertoire de sortie")        bnb_4bit_quant_type="nf4",

    parser.add_argument("--max-steps", type=int, default=500,        bnb_4bit_compute_dtype=torch.bfloat16,

                       help="Nombre maximum d'étapes d'entraînement")    )

    parser.add_argument("--batch-size", type=int, default=2,

                       help="Taille du batch")    # Téléchargement du modèle si nécessaire

    parser.add_argument("--learning-rate", type=float, default=2e-4,    if not os.path.exists(LOCAL_MODEL_DIR):

                       help="Taux d'apprentissage")        print("🌐 Téléchargement du modèle 3B...")

    parser.add_argument("--local-model-dir", type=str,        os.makedirs("./models", exist_ok=True)

                       help="Répertoire local pour le modèle (optionnel)")

        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)

    args = parser.parse_args()        tokenizer.save_pretrained(LOCAL_MODEL_DIR)



    # Charger la configuration depuis le fichier si fourni        model = AutoModelForCausalLM.from_pretrained(

    if args.config:            MODEL_NAME,

        with open(args.config, 'r', encoding='utf-8') as f:            quantization_config=bnb_config,

            config = json.load(f)            device_map="auto",

        # Override avec les arguments de ligne de commande            trust_remote_code=True,

        for key, value in vars(args).items():        )

            if value is not None and key in config:        model.save_pretrained(LOCAL_MODEL_DIR)

                config[key] = value        print("✅ Modèle 3B téléchargé")

        args = argparse.Namespace(**config)    else:

        print("📂 Modèle 3B trouvé en local")

    print(f"🚀 Fine-tuning {args.model_name}")

    # Chargement du modèle

    # Configuration du modèle local    print("🔄 Chargement du modèle 3B...")

    local_model_dir = args.local_model_dir or f"./models/{args.model_name.split('/')[-1]}"    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_DIR, trust_remote_code=True)

    model = AutoModelForCausalLM.from_pretrained(

    # Configuration pour modèle plus petit        LOCAL_MODEL_DIR,

    bnb_config = BitsAndBytesConfig(        quantization_config=bnb_config,

        load_in_4bit=True,        device_map="auto",

        bnb_4bit_use_double_quant=True,        trust_remote_code=True,

        bnb_4bit_quant_type="nf4",    )

        bnb_4bit_compute_dtype=torch.bfloat16,

    )    # Configuration LoRA

    lora_config = LoraConfig(

    # Téléchargement du modèle si nécessaire        r=8,

    if not os.path.exists(local_model_dir):        lora_alpha=16,

        print("🌐 Téléchargement du modèle...")        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],

        os.makedirs("./models", exist_ok=True)        lora_dropout=0.05,

        bias="none",

        tokenizer = AutoTokenizer.from_pretrained(args.model_name, trust_remote_code=True)        task_type="CAUSAL_LM"

        tokenizer.save_pretrained(local_model_dir)    )



        model = AutoModelForCausalLM.from_pretrained(    model = prepare_model_for_kbit_training(model)

            args.model_name,    model = get_peft_model(model, lora_config)

            quantization_config=bnb_config,    model.print_trainable_parameters()

            device_map="auto",

            trust_remote_code=True,    # Chargement du dataset (utilise le même que le notebook)

        )    dataset_path = Path("./out_dataset")

        model.save_pretrained(local_model_dir)    if not dataset_path.exists():

        print("✅ Modèle téléchargé")        print("❌ Dataset non trouvé. Exécutez d'abord le notebook pour générer le dataset.")

    else:        return

        print("📂 Modèle trouvé en local")

    dataset = load_dataset("json", data_files={

    # Chargement du modèle        "train": str(dataset_path / "train.jsonl"),

    print("🔄 Chargement du modèle...")        "validation": str(dataset_path / "valid.jsonl"),

    tokenizer = AutoTokenizer.from_pretrained(local_model_dir, trust_remote_code=True)        "test": str(dataset_path / "test.jsonl")

    model = AutoModelForCausalLM.from_pretrained(    })

        local_model_dir,

        quantization_config=bnb_config,    # Tokenization

        device_map="auto",    def tokenize_function(examples):

        trust_remote_code=True,        texts = [p + "\n" + c for p, c in zip(examples["prompt"], examples["completion"])]

    )        return tokenizer(texts, max_length=512, truncation=True, padding=True)



    # Configuration LoRA    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset["train"].column_names)

    lora_config = LoraConfig(

        r=8,    # Entraînement

        lora_alpha=16,    training_args = TrainingArguments(

        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],        output_dir="./results_3b",

        lora_dropout=0.05,        per_device_train_batch_size=2,  # Plus grand batch size possible avec 3B

        bias="none",        gradient_accumulation_steps=4,

        task_type="CAUSAL_LM"        max_steps=500,  # Limité pour test rapide

    )        learning_rate=2e-4,

        fp16=True,

    model = prepare_model_for_kbit_training(model)        logging_steps=10,

    model = get_peft_model(model, lora_config)        save_steps=100,

    model.print_trainable_parameters()        save_total_limit=2,

        evaluation_strategy="steps",

    # Chargement du dataset        eval_steps=100,

    dataset_path = Path(args.dataset_path)    )

    if not dataset_path.exists():

        print(f"❌ Dataset non trouvé: {dataset_path}")    trainer = Trainer(

        sys.exit(1)        model=model,

        args=training_args,

    dataset = load_dataset("json", data_files={        train_dataset=tokenized_dataset["train"],

        "train": str(dataset_path / "train.jsonl"),        eval_dataset=tokenized_dataset["validation"],

        "validation": str(dataset_path / "valid.jsonl"),        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),

        "test": str(dataset_path / "test.jsonl")    )

    })

    print("🏃 Démarrage de l'entraînement...")

    # Tokenization    trainer.train()

    def tokenize_function(examples):

        texts = [p + "\n" + c for p, c in zip(examples["prompt"], examples["completion"])]    # Sauvegarde

        return tokenizer(texts, max_length=512, truncation=True, padding=True)    model.save_pretrained("./fine_tuned_3b")

    tokenizer.save_pretrained("./fine_tuned_3b")

    tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=dataset["train"].column_names)    print("✅ Modèle fine-tuné sauvegardé dans ./fine_tuned_3b")



    # Entraînementif __name__ == "__main__":

    training_args = TrainingArguments(    main()
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        max_steps=args.max_steps,
        learning_rate=args.learning_rate,
        fp16=True,
        logging_steps=10,
        save_steps=100,
        save_total_limit=2,
        evaluation_strategy="steps",
        eval_steps=100,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["validation"],
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )

    print("🏃 Démarrage de l'entraînement...")
    trainer.train()

    # Sauvegarde
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"✅ Modèle fine-tuné sauvegardé dans {args.output_dir}")

if __name__ == "__main__":
    main()